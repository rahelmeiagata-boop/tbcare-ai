"""Pembacaan teks dengan Tesseract (via pytesseract).

Mengembalikan teks per baris beserta keyakinan (0-100) dan posisi tiap kata,
sehingga bagian yang kurang jelas bisa ditandai dan digambar di UI.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import cv2
import numpy as np
import pytesseract
from pytesseract import Output

from . import config

if config.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_CMD


class OcrUnavailable(RuntimeError):
    """Tesseract belum terpasang / bahasa yang diminta tidak tersedia."""


class OcrTimeout(RuntimeError):
    """OCR melewati batas waktu (biasanya gambar derau/terlalu rumit)."""


@dataclass
class OcrWord:
    text: str
    conf: float
    left: int
    top: int
    width: int
    height: int


@dataclass
class OcrLine:
    text: str
    conf: float
    words: list[OcrWord] = field(default_factory=list)

    @property
    def top(self) -> int:
        return min(w.top for w in self.words) if self.words else 0


@dataclass
class OcrResult:
    lines: list[OcrLine]
    mean_conf: float
    lang: str
    psm: int

    @property
    def text(self) -> str:
        return "\n".join(line.text for line in self.lines)

    def as_pairs(self) -> list[tuple[str, float]]:
        return [(line.text, line.conf) for line in self.lines]


_available_languages: set[str] | None = None


def tesseract_version() -> str:
    try:
        return str(pytesseract.get_tesseract_version())
    except Exception as exc:  # pytesseract.TesseractNotFoundError, dll.
        raise OcrUnavailable(
            "Tesseract tidak ditemukan. Pasang Tesseract OCR atau isi TESSERACT_CMD dengan path-nya."
        ) from exc


def available_languages() -> set[str]:
    global _available_languages
    if _available_languages is None:
        try:
            _available_languages = set(pytesseract.get_languages(config=""))
        except Exception as exc:
            raise OcrUnavailable(
                "Tesseract tidak ditemukan. Pasang Tesseract OCR atau isi TESSERACT_CMD dengan path-nya."
            ) from exc
    return _available_languages


def pick_language(requested: str | None = None) -> str:
    """Ambil bahasa yang diminta dan benar-benar terpasang (mis. 'ind+eng' -> 'eng')."""
    requested = requested or config.TESSERACT_LANG
    available = available_languages()
    chosen = [lang for lang in requested.split("+") if lang in available]
    if not chosen:
        raise OcrUnavailable(
            f"Bahasa Tesseract '{requested}' belum terpasang. Terpasang: {', '.join(sorted(available)) or '-'}."
        )
    return "+".join(chosen)


def run_ocr(image: np.ndarray, lang: str | None = None, psm: int | None = None) -> OcrResult:
    lang = lang or pick_language()
    psm = psm if psm is not None else config.TESSERACT_PSM
    tess_config = f"--psm {psm} -c user_defined_dpi=300"

    try:
        data = pytesseract.image_to_data(
            image,
            lang=lang,
            config=tess_config,
            output_type=Output.DICT,
            timeout=config.OCR_TIMEOUT_SECONDS,
        )
    except RuntimeError as exc:  # pytesseract: "Tesseract process timeout"
        raise OcrTimeout(f"OCR melebihi batas waktu {config.OCR_TIMEOUT_SECONDS} detik.") from exc

    grouped: dict[tuple[int, int, int], list[OcrWord]] = {}
    for i in range(len(data["text"])):
        text = (data["text"][i] or "").strip()
        try:
            conf = float(data["conf"][i])
        except (TypeError, ValueError):
            conf = -1.0
        if not text or conf < 0:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        grouped.setdefault(key, []).append(
            OcrWord(text, conf, int(data["left"][i]), int(data["top"][i]), int(data["width"][i]), int(data["height"][i]))
        )

    lines: list[OcrLine] = []
    for words in grouped.values():
        words.sort(key=lambda w: w.left)
        total_chars = sum(len(w.text) for w in words)
        conf = sum(w.conf * len(w.text) for w in words) / total_chars if total_chars else 0.0
        lines.append(OcrLine(" ".join(w.text for w in words), conf, words))
    lines.sort(key=lambda line: line.top)

    all_chars = sum(len(w.text) for line in lines for w in line.words)
    mean = (
        sum(w.conf * len(w.text) for line in lines for w in line.words) / all_chars if all_chars else 0.0
    )
    return OcrResult(lines=lines, mean_conf=mean, lang=lang, psm=psm)


def draw_boxes(image: np.ndarray, result: OcrResult) -> np.ndarray:
    """Gambar kotak tiap kata; hijau = yakin, oranye = ragu, merah = kurang yakin."""
    canvas = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR) if image.ndim == 2 else image.copy()
    thickness = max(1, round(max(canvas.shape[:2]) / 900))
    for line in result.lines:
        for word in line.words:
            if word.conf >= 75:
                color = (60, 170, 60)
            elif word.conf >= 50:
                color = (0, 150, 240)
            else:
                color = (50, 50, 220)
            cv2.rectangle(
                canvas,
                (word.left, word.top),
                (word.left + word.width, word.top + word.height),
                color,
                thickness,
            )
    return canvas


# --------------------------------------------------- baca ulang baris signa
# Baris aturan pakai pendek ("S 1 dd 1 ac") sering terbaca menempel dan
# bercampur karakter asing ("S1lddtlac"). Baris seperti itu dibaca ulang
# secara terpisah (psm 7) dengan daftar karakter yang dibatasi.
SIGNA_WHITELIST = "S0123456789dacphsxDACPHSX./-"
_RE_SIGNA_GLUED = re.compile(r"s[0-9a-z$|!]{0,3}dd[0-9a-z$|!]{0,8}")
_RE_SIGNA_CLEAN = re.compile(r"^s?\.?(\d{1,2})dd(\d{0,2})\.?(ac|pc|dc|hs)?\.?$")
_RE_SIGNA_OK_ALREADY = re.compile(r"(?<![a-z0-9])\d\s*dd(?![a-z])", re.I)


def _read_single_line(crop: np.ndarray, lang: str, whitelist: str) -> tuple[str, float]:
    crop = cv2.copyMakeBorder(crop, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
    data = pytesseract.image_to_data(
        crop,
        lang=lang,
        config=f"--psm 7 -c user_defined_dpi=300 -c tessedit_char_whitelist={whitelist}",
        output_type=Output.DICT,
        timeout=config.OCR_TIMEOUT_SECONDS,
    )
    words = [
        (str(t).strip(), float(c))
        for t, c in zip(data["text"], data["conf"])
        if str(t).strip() and float(c) >= 0
    ]
    if not words:
        return "", 0.0
    chars = sum(len(t) for t, _ in words)
    return "".join(t for t, _ in words), sum(len(t) * c for t, c in words) / chars


def refine_signa_lines(image: np.ndarray, result: OcrResult, lang: str) -> int:
    """Perbaiki baris aturan pakai yang menempel. Mengembalikan jumlah baris yang diperbaiki."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    refined = 0
    for line in result.lines:
        if not line.words or _RE_SIGNA_OK_ALREADY.search(line.text):
            continue
        compact = re.sub(r"[^a-z0-9$|!]", "", line.text.lower())
        if not _RE_SIGNA_GLUED.fullmatch(compact):
            continue

        x0 = max(0, min(w.left for w in line.words) - 12)
        y0 = max(0, min(w.top for w in line.words) - 10)
        x1 = min(gray.shape[1], max(w.left + w.width for w in line.words) + 12)
        y1 = min(gray.shape[0], max(w.top + w.height for w in line.words) + 10)
        if x1 <= x0 or y1 <= y0:
            continue

        text, conf = _read_single_line(gray[y0:y1, x0:x1], lang, SIGNA_WHITELIST)
        match = _RE_SIGNA_CLEAN.match(re.sub(r"[^a-z0-9./]", "", text.lower()))
        if not match:
            continue
        freq, per_dose, relation = match.groups()
        line.text = " ".join(part for part in ("S", freq, "dd", per_dose, relation) if part)
        line.conf = conf
        for word in line.words:  # kotak di UI mengikuti keyakinan hasil baca ulang
            word.conf = conf
        refined += 1
    return refined
