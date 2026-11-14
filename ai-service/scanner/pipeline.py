"""Pipeline lengkap: gambar -> image processing -> OCR -> parsing -> daftar obat."""
from __future__ import annotations

import base64
import time
from dataclasses import dataclass

import cv2
import numpy as np

from . import config
from .matcher import DrugMatcher
from .ocr import (
    OcrResult,
    OcrTimeout,
    OcrUnavailable,
    draw_boxes,
    pick_language,
    refine_signa_lines,
    run_ocr,
    tesseract_version,
)
from .parser import ParseResult, parse_lines
from .preprocess import Preprocessed, Step, preprocess

MAX_PIXELS = 40_000_000  # cegah gambar raksasa menghabiskan memori
MIN_SIDE = 200
RESCUE_BELOW_CONFIDENCE = 45.0  # coba putar 90 derajat bila OCR sangat tidak yakin
LOW_CONFIDENCE_WARNING = 60.0

_matcher: DrugMatcher | None = None


class ScanError(Exception):
    def __init__(self, message: str, status: int = 400, code: str = "scan_error"):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


def get_matcher() -> DrugMatcher:
    global _matcher
    if _matcher is None:
        _matcher = DrugMatcher()
    return _matcher


# --------------------------------------------------------------- gambar
def decode_image(data: bytes) -> np.ndarray:
    if not data:
        raise ScanError("File gambar kosong.", 400, "empty_file")
    if len(data) > config.MAX_IMAGE_BYTES:
        raise ScanError(f"Ukuran gambar melebihi {config.MAX_IMAGE_MB} MB.", 413, "file_too_large")

    img = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ScanError("File bukan gambar yang valid (gunakan JPG, PNG, atau WEBP).", 400, "invalid_image")

    h, w = img.shape[:2]
    if min(h, w) < MIN_SIDE:
        raise ScanError("Gambar terlalu kecil. Ambil foto resep dengan resolusi lebih tinggi.", 400, "image_too_small")
    if h * w > MAX_PIXELS:
        raise ScanError("Resolusi gambar terlalu besar. Perkecil gambar lalu coba lagi.", 413, "image_too_large")
    return img


def encode_step(image: np.ndarray) -> str:
    """Thumbnail JPEG base64 (data URL) untuk ditampilkan di UI."""
    h, w = image.shape[:2]
    if w > config.STEP_THUMB_WIDTH:
        scale = config.STEP_THUMB_WIDTH / w
        image = cv2.resize(image, (config.STEP_THUMB_WIDTH, max(1, round(h * scale))), interpolation=cv2.INTER_AREA)
    ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ok:
        return ""
    return "data:image/jpeg;base64," + base64.b64encode(buffer.tobytes()).decode("ascii")


# ------------------------------------------------------------ evaluasi
@dataclass
class _Candidate:
    variant: str
    image: np.ndarray
    ocr: OcrResult
    parsed: ParseResult

    @property
    def score(self) -> float:
        # Utamakan jumlah obat yang cocok dengan dataset, lalu keyakinan OCR.
        completeness = sum(
            (m.dosage is not None) + (m.frequency is not None) for m in self.parsed.medications if m.matched
        )
        return self.parsed.matched_count * 1000 + completeness * 20 + self.ocr.mean_conf


def _evaluate(variant: str, image: np.ndarray, lang: str, matcher: DrugMatcher) -> _Candidate:
    ocr = run_ocr(image, lang=lang)
    refine_signa_lines(image, ocr, lang)
    parsed = parse_lines(ocr.as_pairs(), matcher)
    return _Candidate(variant, image, ocr, parsed)


def _is_complete(candidate: _Candidate) -> bool:
    """Semua obat yang dikenali sudah punya dosis, frekuensi, dan jumlah/durasi,
    dan OCR cukup yakin: varian gambar lain tidak perlu dicoba lagi."""
    matched = [m for m in candidate.parsed.medications if m.matched]
    return (
        bool(matched)
        and candidate.ocr.mean_conf >= 75
        and all(m.dosage and m.frequency and (m.quantity or m.duration_days) for m in matched)
    )


def _variant_images(pre: Preprocessed) -> list[tuple[str, np.ndarray]]:
    available = {"gray": pre.gray, "binary": pre.binary}
    names = [v for v in config.OCR_VARIANTS if v in available] or ["gray"]
    return [(name, available[name]) for name in names]


# ---------------------------------------------------------------- utama
def scan_image_bytes(data: bytes, include_steps: bool = True) -> dict:
    timing: dict[str, int] = {}
    started = time.perf_counter()

    img = decode_image(data)
    original_size = [int(img.shape[1]), int(img.shape[0])]

    try:
        lang = pick_language()
        version = tesseract_version()
    except OcrUnavailable as exc:
        raise ScanError(str(exc), 503, "ocr_unavailable") from exc

    requested = set(config.TESSERACT_LANG.split("+"))
    missing_languages = sorted(requested - set(lang.split("+")))

    # 1) image processing
    t0 = time.perf_counter()
    pre = preprocess(img)
    timing["preprocess"] = round((time.perf_counter() - t0) * 1000)

    if pre.info.get("components", 0) > config.MAX_TEXT_COMPONENTS or pre.info.get("black_ratio", 0) > config.MAX_BLACK_RATIO:
        raise ScanError(
            "Gambar tidak tampak seperti dokumen resep. Foto resep dari dekat dengan latar yang polos.",
            422,
            "not_a_document",
        )

    def out_of_time() -> bool:
        return time.perf_counter() - started > config.SCAN_TIME_BUDGET_SECONDS

    # 2) OCR pada tiap varian gambar, pilih yang terbaik
    matcher = get_matcher()
    t0 = time.perf_counter()
    try:
        candidates: list[_Candidate] = []
        for name, image in _variant_images(pre):
            if candidates and out_of_time():
                break
            candidates.append(_evaluate(name, image, lang, matcher))
            if _is_complete(candidates[-1]):
                break

        best = max(candidates, key=lambda c: c.score)

        # Penyelamatan: foto kadang terbalik/miring 90 derajat.
        if best.ocr.mean_conf < RESCUE_BELOW_CONFIDENCE:
            for code, label in ((cv2.ROTATE_90_CLOCKWISE, "rot90"), (cv2.ROTATE_90_COUNTERCLOCKWISE, "rot270")):
                if out_of_time():
                    break
                rotated = _evaluate(f"{best.variant}+{label}", cv2.rotate(best.image, code), lang, matcher)
                if rotated.score > best.score + 100 or rotated.ocr.mean_conf > best.ocr.mean_conf + 15:
                    best = rotated
    except OcrTimeout as exc:
        raise ScanError(
            "Gambar terlalu rumit untuk dibaca (waktu habis). Foto resep dari dekat dengan latar yang polos.",
            422,
            "ocr_timeout",
        ) from exc
    except OcrUnavailable as exc:
        raise ScanError(str(exc), 503, "ocr_unavailable") from exc
    timing["ocr"] = round((time.perf_counter() - t0) * 1000)

    # 3) susun jawaban
    medications = [m.to_dict(i) for i, m in enumerate(best.parsed.medications)]

    warnings: list[str] = []
    if min(original_size) < config.MIN_INPUT_SIDE_WARN:
        warnings.append("Resolusi foto rendah, teks kecil bisa salah terbaca. Ambil foto lebih dekat.")
    if not best.ocr.lines:
        warnings.append("Tidak ada teks yang terbaca. Pastikan foto resep jelas, terang, dan tidak buram.")
    elif best.ocr.mean_conf < LOW_CONFIDENCE_WARNING:
        warnings.append(
            f"Teks sulit terbaca (keyakinan rata-rata {round(best.ocr.mean_conf)}%). "
            "Foto ulang dengan cahaya merata, kamera tegak lurus, dan resep memenuhi bingkai."
        )
    if best.ocr.lines and not medications:
        warnings.append(
            "Tidak ada obat yang dikenali pada resep ini. Periksa teks hasil OCR di bawah "
            "atau tambahkan obat secara manual di menu Obat Saya."
        )

    steps: list[dict] = []
    if include_steps:
        step_list: list[Step] = list(pre.steps)
        step_list.append(
            Step(
                "ocr",
                "Deteksi teks (OCR)",
                "Kotak hijau = yakin, oranye = ragu, merah = kurang yakin. "
                f"Varian gambar yang dipakai: {best.variant}.",
                draw_boxes(best.image, best.ocr),
            )
        )
        steps = [
            {"key": s.key, "title": s.title, "description": s.description, "image": encode_step(s.image)}
            for s in step_list
        ]

    timing["total"] = round((time.perf_counter() - started) * 1000)

    return {
        "success": True,
        "medications": medications,
        "summary": {
            "detected": len(medications),
            "matched": best.parsed.matched_count,
            "needs_review": sum(1 for m in medications if m["needs_review"]),
        },
        "ocr": {
            "text": best.ocr.text,
            "mean_confidence": round(best.ocr.mean_conf, 1),
            "lines": [{"text": line.text, "confidence": round(line.conf, 1)} for line in best.ocr.lines],
        },
        "engine": {
            "ocr": "tesseract",
            "version": version,
            "lang": lang,
            "missing_languages": missing_languages,
            "psm": best.ocr.psm,
            "variant": best.variant,
            "dataset_version": matcher.version,
        },
        "image": {"original_size": original_size, **pre.info},
        "warnings": warnings,
        "steps": steps,
        "drug_names": matcher.names,
        "timing_ms": timing,
    }
