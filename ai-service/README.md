# TBCare AI Service

Layanan pemindaian resep dokter untuk TBCare. Pipeline:

```
foto resep ─► image processing (OpenCV) ─► OCR (Tesseract) ─► parser resep ─► cocokkan ke dataset obat TBC
```

| Tahap | Teknik |
|---|---|
| Ubah ukuran | sisi terpanjang dinormalkan (1500–2000 px) |
| Koreksi perspektif | deteksi 4 sudut kertas (Otsu/Canny + `approxPolyDP`) lalu `warpPerspective` |
| Grayscale | `cvtColor` |
| Normalisasi pencahayaan | bagi gambar dengan estimasi latar (closing morfologi) → bayangan hilang |
| Denoise + kontras | bilateral filter, peregangan histogram, CLAHE |
| Koreksi kemiringan (deskew) | maksimalkan varians proyeksi horizontal (galat uji ≤ 0,1°) |
| Binarisasi | Sauvola threshold + buang bintik kecil |
| Potong area teks | bounding box komponen teks, abaikan garis tepi/bayangan |
| OCR | Tesseract (`ind+eng`), dua varian gambar (gray/binary), dipilih yang terbaik |
| Baca ulang baris aturan pakai | baris `S 1 dd 1 ac` dibaca ulang dengan daftar karakter terbatas |
| Parsing | nama, dosis, `No. XXX`, `3 dd 1`, `3x1`, `1-0-1`, `ac/pc/dc/hs`, durasi |
| Pencocokan | Levenshtein ternormalisasi terhadap `data/tb_drugs.json` |

> **Penting:** hasil scan hanyalah *usulan*. Aplikasi selalu meminta pasien memeriksa dan
> mengonfirmasi sebelum disimpan. Tulisan tangan dokter akurasinya jauh lebih rendah daripada
> resep cetak. Dataset obat perlu diverifikasi apoteker/dokter sebelum dipakai di luar tugas akademik.

## Menjalankan

### 1. Pasang Tesseract
- **Windows**: unduh installer dari <https://github.com/UB-Mannheim/tesseract/wiki>, buka
  *Additional language data* dan **centang Indonesian**, biarkan lokasi bawaan
  `C:\Program Files\Tesseract-OCR`. Lokasi itu (dan PATH) dicari otomatis, jadi tidak perlu
  mengatur apa pun. Bila dipasang di tempat lain:
  `setx TESSERACT_CMD "D:\alat\Tesseract-OCR\tesseract.exe"`, lalu buka terminal baru.
- **Ubuntu/Debian**: `sudo apt install tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng`
- **macOS**: `brew install tesseract tesseract-lang`

Bila bahasa `ind` belum terpasang, layanan otomatis memakai `eng` (nama obat tetap terbaca).

### 2. Pasang dependensi dan jalankan
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Windows PowerShell: .venv\Scripts\Activate.ps1 | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python app.py                   # http://127.0.0.1:8000
```
Cek <http://127.0.0.1:8000/health>: `"status":"ok"` berarti Tesseract ditemukan.
Panduan lengkap beserta pemecahan masalah ada di `README.md` utama proyek.

### 3. Uji tanpa server (cocok untuk demo ke dosen)
```bash
python -m scanner.cli samples/resep_contoh.jpg --steps-dir hasil_tahapan
```
Setiap tahap image processing tersimpan sebagai gambar (`01_original.jpg`, `02_perspective.jpg`, …).

### 4. Test otomatis
```bash
python -m unittest discover -s tests -t . -v
```
Test integrasi memakai Tesseract asli dan dilewati otomatis bila Tesseract belum terpasang.

## API

`POST /scan` — `multipart/form-data`
- `image` (wajib): file JPG/PNG/WEBP, maks. 8 MB
- `include_steps` (opsional): `0` untuk tidak mengirim gambar tiap tahap

Respons berisi `medications[]` (field sama dengan form Obat Saya: `med_name`, `dosage`, `frequency`,
`duration_days`, `stock`, `consumption_schedule`, ditambah `confidence`, `needs_review`, `issues`),
`ocr` (teks mentah & keyakinan), `steps[]` (gambar base64), `warnings`, dan `timing_ms`.

Kode galat: `missing_image`, `invalid_image`, `image_too_small`, `file_too_large` (413),
`not_a_document` (422), `ocr_timeout` (422), `ocr_unavailable` (503), `unauthorized` (401).

## Konfigurasi (environment variable)

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` / `HOST` | `8000` / `127.0.0.1` | Alamat server dev |
| `TESSERACT_CMD` | otomatis | Dicari di PATH dan `C:\Program Files\Tesseract-OCR`; isi hanya bila di lokasi lain |
| `TESSERACT_LANG` | `ind+eng` | Bahasa; yang belum terpasang dilewati |
| `TESSERACT_PSM` | `6` | Page segmentation mode |
| `OCR_VARIANTS` | `gray,binary` | Varian gambar untuk OCR (`gray` saja lebih cepat) |
| `OCR_TIMEOUT_SECONDS` | `15` | Batas waktu satu panggilan OCR |
| `SCAN_TIME_BUDGET_SECONDS` | `20` | Setelah lewat, varian/rotasi tambahan dilewati |
| `MAX_IMAGE_MB` | `8` | Batas ukuran upload |
| `AI_SERVICE_API_KEY` | – | Bila diisi, `/scan` wajib header `X-API-Key` |
| `DRUG_DATASET_PATH` | `data/tb_drugs.json` | Lokasi dataset obat |

## Deploy
`Dockerfile` sudah menyertakan Tesseract + bahasa Indonesia. Vercel tidak cocok untuk layanan ini
(OpenCV + Tesseract); gunakan Render, Railway, atau Hugging Face Spaces (Docker), lalu isi
`AI_SERVICE_URL` (dan `AI_SERVICE_API_KEY`) di backend Express.

## Menambah obat ke dataset
Edit `data/tb_drugs.json`: tambah entri dengan `name` (nama baku), `aliases` (ejaan lain / singkatan /
merek) dan, bila perlu, `typical_strengths_mg` (kekuatan sediaan lazim; dipakai untuk memberi peringatan
bila angka dosis terbaca tidak umum). Singkatan ≤ 4 huruf hanya cocok persis (tanpa fuzzy).
