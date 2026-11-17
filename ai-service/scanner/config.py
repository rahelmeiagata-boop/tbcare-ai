"""Konfigurasi ai-service.

Semua nilai dapat diubah lewat environment variable tanpa menyentuh kode.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# --- Dataset obat -----------------------------------------------------------
DRUG_DATASET_PATH = Path(os.getenv("DRUG_DATASET_PATH", BASE_DIR / "data" / "tb_drugs.json"))

# --- Tesseract --------------------------------------------------------------
def _find_tesseract() -> str:
    """Tentukan perintah Tesseract.

    1. TESSERACT_CMD bila diisi (selalu menang).
    2. Kosong ("pakai PATH") bila `tesseract` sudah ada di PATH.
    3. Lokasi instalasi umum Windows bila filenya ada di sana.
    Mengembalikan "" bila tidak ketemu; pesan galat akan muncul saat OCR dipakai.
    """
    explicit = os.getenv("TESSERACT_CMD", "").strip()
    if explicit:
        return explicit
    if shutil.which("tesseract"):
        return ""
    for candidate in (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    ):
        if os.path.isfile(candidate):
            return candidate
    return ""


TESSERACT_CMD = _find_tesseract()
# Bahasa yang diminta. Yang belum terpasang otomatis dilewati.
TESSERACT_LANG = os.getenv("TESSERACT_LANG", "ind+eng")
# Page segmentation mode: 6 = satu blok teks seragam (cocok untuk resep/form).
TESSERACT_PSM = _int("TESSERACT_PSM", 6)
OCR_TIMEOUT_SECONDS = _int("OCR_TIMEOUT_SECONDS", 15)
# Anggaran waktu satu pemindaian. Setelah terlampaui, varian/rotasi tambahan
# dilewati dan hasil terbaik yang sudah ada dikembalikan.
SCAN_TIME_BUDGET_SECONDS = _int("SCAN_TIME_BUDGET_SECONDS", 20)
# Ambang "bukan dokumen teks". Terukur: halaman teks sangat padat ~12% piksel
# hitam dan ~3.000 komponen; gambar derau/tekstur ~22% dan 2.000-11.000 komponen.
MAX_TEXT_COMPONENTS = _int("MAX_TEXT_COMPONENTS", 9000)
MAX_BLACK_RATIO = float(os.getenv("MAX_BLACK_RATIO", "0.20"))
# Varian gambar yang dicoba OCR; yang hasilnya terbaik dipakai.
# Pilihan: gray (grayscale yang sudah ditingkatkan), binary (hitam-putih).
OCR_VARIANTS = [v.strip() for v in os.getenv("OCR_VARIANTS", "gray,binary").split(",") if v.strip()]

# --- Ukuran gambar ----------------------------------------------------------
MAX_IMAGE_MB = _int("MAX_IMAGE_MB", 8)
MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024
# Gambar kerja: sisi terpanjang dibatasi agar cepat, tetapi tidak terlalu kecil
# agar huruf tetap terbaca Tesseract (tinggi huruf idealnya >= 20 px).
WORKING_MAX_SIDE = _int("WORKING_MAX_SIDE", 2000)
WORKING_MIN_SIDE = _int("WORKING_MIN_SIDE", 1500)
MIN_INPUT_SIDE_WARN = 600
# Lebar thumbnail tiap tahap untuk ditampilkan di UI.
STEP_THUMB_WIDTH = _int("STEP_THUMB_WIDTH", 560)

# --- Keamanan antar-layanan -------------------------------------------------
# Jika diisi, request ke /scan wajib membawa header X-API-Key yang sama.
API_KEY = os.getenv("AI_SERVICE_API_KEY", "").strip()

# --- Pencocokan nama obat ---------------------------------------------------
FUZZY_MIN_SIMILARITY = float(os.getenv("FUZZY_MIN_SIMILARITY", "0.80"))
