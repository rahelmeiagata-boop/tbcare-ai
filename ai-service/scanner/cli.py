"""Uji pemindaian dari terminal, tanpa menjalankan server.

    python -m scanner.cli samples/resep_contoh.jpg
    python -m scanner.cli foto_resep.jpg --steps-dir hasil_tahapan
    python -m scanner.cli foto_resep.jpg --json

Dengan --steps-dir, setiap tahap image processing disimpan sebagai gambar
berukuran penuh (01_original.png, 02_perspective.png, ...) sehingga mudah
ditunjukkan saat presentasi.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

from . import config
from .pipeline import ScanError, scan_image_bytes


def _save_steps(steps: list[dict], folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for i, step in enumerate(steps, 1):
        data_url = step["image"]
        if not data_url:
            continue
        raw = base64.b64decode(data_url.split(",", 1)[1])
        path = folder / f"{i:02d}_{step['key']}.jpg"
        path.write_bytes(raw)
        print(f"  tahap {i}: {step['title']:<32} -> {path}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan resep (OpenCV + Tesseract) dari terminal.")
    parser.add_argument("image", help="Path foto/scan resep (JPG/PNG/WEBP)")
    parser.add_argument("--steps-dir", help="Simpan gambar tiap tahap image processing ke folder ini")
    parser.add_argument("--json", action="store_true", help="Cetak hasil mentah sebagai JSON")
    args = parser.parse_args(argv)

    path = Path(args.image)
    if not path.is_file():
        print(f"File tidak ditemukan: {path}", file=sys.stderr)
        return 2

    if args.steps_dir:
        config.STEP_THUMB_WIDTH = 100_000  # jangan perkecil gambar tahapan

    try:
        result = scan_image_bytes(path.read_bytes(), include_steps=bool(args.steps_dir))
    except ScanError as exc:
        print(f"Gagal ({exc.code}): {exc.message}", file=sys.stderr)
        return 1

    if args.json:
        result.pop("steps", None)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    engine, ocr = result["engine"], result["ocr"]
    print(f"OCR     : {engine['ocr']} {engine['version']} (bahasa {engine['lang']}, varian {engine['variant']})")
    print(f"Waktu   : {result['timing_ms']['total']} ms   Keyakinan rata-rata OCR: {ocr['mean_confidence']}%")
    for warning in result["warnings"]:
        print(f"Catatan : {warning}")

    print(f"\nObat terdeteksi: {result['summary']['detected']} ({result['summary']['needs_review']} perlu dicek)")
    for med in result["medications"]:
        flag = "  [PERLU DICEK]" if med["needs_review"] else ""
        duration = f"{med['duration_days']}{'~' if med['duration_estimated'] else ''}"
        print(
            f"- {med['med_name']}: dosis={med['dosage']}, {med['frequency']}x/hari, "
            f"durasi={duration} hari, jumlah={med['stock']}, jadwal={med['consumption_schedule'] or '-'}{flag}"
        )
        for issue in med["issues"]:
            print(f"    ! {issue}")

    print("\nTeks hasil OCR:")
    for line in ocr["lines"]:
        print(f"  {line['text']}")

    if args.steps_dir:
        print("\nTahapan image processing:")
        _save_steps(result["steps"], Path(args.steps_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
