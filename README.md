# TBCare AI

Aplikasi web untuk memantau pengobatan pasien TBC: pengingat minum obat, pemantauan oleh
pendamping/keluarga, dan **scan resep dokter** yang hasilnya disimpan ke data obat pasien.

Scan resep memakai **image processing (OpenCV) + OCR (Tesseract)**, lalu hasil bacaan dicocokkan
dengan dataset obat TBC. Hasilnya hanya berupa usulan: pasien selalu memeriksa dan mengonfirmasi
sebelum disimpan.

## Isi proyek

| Folder | Isi | Teknologi | Port |
|---|---|---|---|
| `client/` | Antarmuka web | React + Vite + Tailwind | tampil di terminal (biasanya 5173) |
| `server/` | REST API | Node.js + Express + MySQL | 5000 |
| `ai-service/` | Layanan scan resep | Python + Flask + OpenCV + Tesseract | 8000 |
| `database/` | Skema database | MySQL | - |

Alur scan resep: `client` → `server` (`/api/scanner/*`) → `ai-service` (`/scan`). Frontend tidak
pernah memanggil `ai-service` langsung.

---

## 1. Prasyarat

| Perangkat lunak | Versi | Dipakai untuk |
|---|---|---|
| Node.js | 18 atau lebih baru (disarankan LTS 20/22) | server dan client |
| MySQL | 8.x (atau MariaDB setara) | database |
| Python | **3.11 atau 3.12** | ai-service |
| Tesseract OCR | 5.x | membaca teks resep |

Cek versinya:
```
node --version
python --version
```
Saat memasang Python di Windows, **centang "Add python.exe to PATH"**.

---

## 2. Database

1. Buat database kosong, misalnya `tbcare_ai`.
2. Impor `database/schema.sql`. Berkas ini sudah disinkronkan dengan seluruh query di `server/`
   (tabel, kolom, dan nilai ENUM), termasuk `users.username`, `daily_checkins`, dan
   `push_subscriptions`.

**Sudah terlanjur membuat database dari `schema.sql` versi lama?** Gejalanya antara lain
`Unknown column 'username' in 'where clause'` saat register. Pilih salah satu:

- **Hanya berisi data uji**: hapus database lalu impor ulang `database/schema.sql`. Ini cara termudah.
- **Ada data yang ingin dipertahankan**: jalankan seluruh isi
  `database/migrations/001_sync_schema_with_code.sql` pada database tersebut. Skrip ini aman
  dijalankan berulang kali dan tidak menghapus data, tetapi buat backup dulu. Tabel pemeriksaan di
  baris paling bawah hasilnya harus `ok = 1` semua.

**Akun uji tanpa register** (hanya untuk pengembangan lokal): jalankan `database/dev_seed.sql`.
Hasilnya dua akun dengan password `Tes12345`: `pasien.uji@example.com` (pasien) dan
`pendamping.uji@example.com` (pendamping, sudah terhubung ke pasien). Jangan dipakai di database
produksi.

---

## 3. Backend (`server/`)

Buat file `server/.env` (jangan di-commit; sudah masuk `.gitignore`):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=isi_password_mysql
DB_NAME=tbcare_ai
JWT_SECRET=isi_dengan_teks_acak_yang_panjang
VAPID_SUBJECT=mailto:emailanda@contoh.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Kunci VAPID (untuk notifikasi push) bisa dibuat dengan `npx web-push generate-vapid-keys`.
Cukup isi `VAPID_*` di sini: client mengambil kunci publiknya dari server
(`GET /api/push/public-key`), jadi tidak ada konfigurasi VAPID di sisi client. Service worker ada di
`client/public/sw.js`. Notifikasi push hanya berjalan di `localhost` atau HTTPS, dan pengguna harus
mengizinkan notifikasi (diminta saat membuka dashboard, atau lewat tombol **Aktifkan Notifikasi**
di Pengaturan).

Variabel untuk scan resep bersifat opsional. Tanpa diisi, backend memanggil `http://127.0.0.1:8000`:

```env
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_API_KEY=
AI_SERVICE_TIMEOUT_MS=45000
```

Jalankan:
```
cd server
npm install
npm run dev
```
Berhasil bila muncul `Connected to MySQL` dan `Server berjalan di http://localhost:5000`.

---

## 4. Frontend (`client/`)

```
cd client
npm install
npm run dev
```
Buka alamat yang tampil di terminal. Permintaan `/api/*` otomatis diteruskan ke backend di port 5000
(lihat `client/vite.config.js`).

---

## 5. Pasang Tesseract OCR

### Windows
1. Unduh installer Windows 64-bit dari <https://github.com/UB-Mannheim/tesseract/wiki>.
2. Jalankan installer. Pada layar komponen, buka **Additional language data (download)** dan
   **centang "Indonesian"**. Bahasa Inggris sudah termasuk.
3. Biarkan lokasi bawaan `C:\Program Files\Tesseract-OCR`.
4. Cek di Command Prompt:
   ```
   "C:\Program Files\Tesseract-OCR\tesseract.exe" --list-langs
   ```
   Daftar harus memuat `eng`, `ind`, dan `osd`.

Anda **tidak perlu** mengatur PATH bila Tesseract ada di lokasi bawaan: `ai-service` mencarinya
sendiri di PATH dan di `C:\Program Files\Tesseract-OCR`. Bila dipasang di tempat lain, simpan
lokasinya sekali:
```
setx TESSERACT_CMD "D:\alat\Tesseract-OCR\tesseract.exe"
```
lalu **tutup semua terminal dan buka yang baru** (`setx` tidak memengaruhi terminal yang sedang
terbuka; pengguna VS Code harus menutup VS Code sepenuhnya).

### Ubuntu / Debian
```
sudo apt install tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng
```

### macOS
```
brew install tesseract tesseract-lang
```

Bila bahasa `ind` belum terpasang, layanan otomatis memakai `eng` (nama obat tetap terbaca).

---

## 6. AI service (`ai-service/`)

Buat lingkungan virtual **sekali saja**, lalu pasang dependensi:

**Command Prompt**
```
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**PowerShell**
```
cd ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
Bila PowerShell menolak menjalankan skrip, jalankan dulu
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

**Linux / macOS**
```
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Tanda venv aktif: awal baris terminal menampilkan `(.venv)`.

### Cek instalasi
```
python -m scanner.cli samples/resep_contoh.jpg
```
Hasil yang benar: `Obat terdeteksi: 5` (Rifampisin, Isoniazid, Pirazinamid, Etambutol, Vitamin B6).

Untuk melihat tiap tahap image processing sebagai gambar (cocok untuk presentasi):
```
python -m scanner.cli samples/resep_contoh.jpg --steps-dir hasil_tahapan
```

### Jalankan layanan
```
python app.py
```
Buka <http://127.0.0.1:8000/health>. Yang diharapkan:
```json
{"status":"ok","tesseract":"5.x.x","languages":["eng","ind","osd"],"lang_in_use":"ind+eng", ...}
```
`"status":"degraded"` berarti Tesseract belum ditemukan; lihat bagian Pemecahan masalah.

---

## 7. Menjalankan sehari-hari

Dibutuhkan **tiga terminal**, masing-masing dibiarkan menyala:

| Terminal | Perintah |
|---|---|
| 1. AI service | `cd ai-service` → `.venv\Scripts\activate` → `python app.py` |
| 2. Backend | `cd server` → `npm run dev` |
| 3. Frontend | `cd client` → `npm run dev` |

Lalu login, buka tab **Scanning Resep AI**, unggah foto resep, dan klik **Scan Resep**.
Hasilnya berupa kartu obat yang bisa diedit. Periksa setiap isian, centang obat yang ingin
disimpan, lalu klik **Simpan**. Obat langsung muncul di **Obat Saya** beserta jadwal
pengingatnya. Di bagian bawah hasil ada galeri **Tahapan image processing** dan teks mentah OCR.

Tanpa `ai-service`, seluruh aplikasi tetap berjalan; hanya fitur scan yang menampilkan
"Layanan scan sedang tidak tersedia".

---

## 8. Variabel lingkungan ai-service

Semua opsional.

| Variabel | Default | Keterangan |
|---|---|---|
| `TESSERACT_CMD` | otomatis | Path `tesseract.exe`; hanya perlu bila dipasang di lokasi tak umum |
| `TESSERACT_LANG` | `ind+eng` | Bahasa OCR; yang belum terpasang dilewati. Coba `eng` bila hasil `ind+eng` kurang baik |
| `OCR_VARIANTS` | `gray,binary` | `gray` saja lebih cepat |
| `PORT` / `HOST` | `8000` / `127.0.0.1` | Alamat server |
| `AI_SERVICE_API_KEY` | - | Bila diisi, `/scan` wajib header `X-API-Key` (isi sama di backend) |
| `MAX_IMAGE_MB` | `8` | Batas ukuran gambar |

Daftar lengkap ada di `ai-service/README.md`.

Mengatur variabel hanya untuk satu sesi terminal: `set NAMA=nilai` (Command Prompt) atau
`$env:NAMA="nilai"` (PowerShell). Untuk permanen di Windows gunakan `setx`.

---

## 9. Test otomatis

```
cd ai-service
python -m unittest discover -s tests -t . -v
```
Test integrasi memakai Tesseract asli pada gambar resep sintetis dan dilewati otomatis bila
Tesseract belum terpasang.

---

## 10. Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `/health` berisi `"status":"degraded"` dan "Tesseract tidak ditemukan" | Pastikan filenya ada: `dir "C:\Program Files\Tesseract-OCR\tesseract.exe"`. Bila ada di tempat lain, `setx TESSERACT_CMD "..."` lalu buka terminal baru dan jalankan ulang `python app.py`. Server yang sudah menyala tidak membaca variabel yang baru diatur. |
| `setx` sudah dijalankan tapi tidak terbaca | Terminal harus dibuka ulang. Cek dengan `echo %TESSERACT_CMD%` (Command Prompt) atau `echo $env:TESSERACT_CMD` (PowerShell). Di VS Code, tutup aplikasinya sepenuhnya. |
| `'python' is not recognized` | Python belum masuk PATH. Pasang ulang dan centang "Add python.exe to PATH". |
| `ModuleNotFoundError: No module named 'flask'` (atau `cv2`, `pytesseract`) | venv belum aktif atau dependensi belum dipasang. Aktifkan `.venv`, lalu `pip install -r requirements.txt`. |
| `pip install` gagal pada `opencv` atau `numpy` | Versi Python tidak cocok. Pakai 3.11 atau 3.12, lalu `python -m pip install --upgrade pip`. |
| PowerShell: "running scripts is disabled" | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, lalu aktifkan venv lagi. |
| `lang_in_use` hanya `eng` | Bahasa Indonesia belum terpasang. Jalankan ulang installer dan centang Indonesian. Layanan tetap berjalan. |
| Port 8000 sudah dipakai | `set PORT=8001` sebelum `python app.py`, lalu isi `AI_SERVICE_URL=http://127.0.0.1:8001` di `server/.env` dan restart backend. |
| Di aplikasi: "Layanan scan resep belum dapat dihubungi" | `ai-service` belum menyala atau alamatnya berbeda dengan `AI_SERVICE_URL`. Cek `http://127.0.0.1:8000/health`. |
| Banner "Layanan scan sedang tidak tersedia" | Sama seperti di atas; banner muncul bila backend tidak bisa menjangkau `ai-service`. |
| Pesan "Gambar tidak tampak seperti dokumen resep" | Foto berisi tekstur/derau, bukan teks. Foto resep dari dekat dengan latar polos dan cahaya merata. |
| Hasil scan banyak yang salah | Tulisan tangan memang jauh lebih sulit dibaca. Coba foto lebih terang dan tegak lurus, atau `set TESSERACT_LANG=eng`. Obat yang meragukan ditandai "Perlu dicek". |
| Log `GET /favicon.ico 404` | Normal. Browser meminta ikon otomatis. |

---

## 11. Batasan dan keamanan

- Hasil scan **hanyalah usulan**. Cocokkan dengan resep asli sebelum menyimpan, dan tanyakan ke
  dokter atau apoteker bila ragu. Sistem tidak menggantikan pertimbangan tenaga kesehatan.
- Akurasi diuji pada resep cetak sintetis. **Tulisan tangan dokter belum diuji** dan hampir pasti
  kurang akurat.
- Isi `ai-service/data/tb_drugs.json` (nama obat dan kekuatan sediaan lazim) perlu diverifikasi
  apoteker/dokter sebelum dipakai di luar keperluan akademik.
- Foto resep **tidak disimpan** di server. Yang dicatat hanya baris obat hasil bacaan
  (`ocr_results`), tanpa nama dokter atau pasien.
- Jangan membagikan atau meng-commit `server/.env`. Bila pernah ikut terkirim, ganti password
  database, `JWT_SECRET`, dan kunci VAPID.

## 12. Deploy

Lihat `DEPLOY_VERCEL.md`. Backend dan frontend dapat di-deploy ke Vercel, sedangkan `ai-service`
harus di-host terpisah (memakai `ai-service/Dockerfile`) karena memerlukan OpenCV dan Tesseract.
