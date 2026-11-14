# TBCare deployment

## 1. Database

Backend TBCare memakai MySQL. `localhost` tidak bisa dipakai di Vercel.

Buat database MySQL cloud, misalnya TiDB Cloud Serverless, lalu jalankan `database/schema.sql` pada database tersebut.

Isi environment variable backend:

DB_HOST=host database
DB_PORT=4000
DB_USER=user database
DB_PASSWORD=password database
DB_NAME=tbcare_ai
JWT_SECRET=buat-secret-random
VAPID_SUBJECT=mailto:email-anda
VAPID_PUBLIC_KEY=public-key
VAPID_PRIVATE_KEY=private-key

## 2. Vercel

Import repository ini ke Vercel dari root repository.

Build command:
npm --prefix client run build

Output directory:
client/dist

Tambahkan semua environment variable backend di Project Settings > Environment Variables.

Untuk frontend, VITE_API_URL boleh dikosongkan karena project sudah memakai `/api` pada deployment yang sama.

Setelah env disimpan, lakukan redeploy.

## 3. API test

Buka:
https://DOMAIN-VERCEL/api/health

Harus muncul JSON:
{"success":true,"message":"TBCare API is running"}

## 4. Register

Buka halaman register dan coba buat akun baru. Request akan masuk ke:
/api/auth/register

## 5. AI service (scan resep)

Fitur scan resep memakai layanan Python terpisah di folder `ai-service/` (OpenCV + Tesseract).
Layanan ini tidak bisa berjalan di Vercel, jadi deploy ke hosting yang mendukung Docker
(Render, Railway, atau Hugging Face Spaces) memakai `ai-service/Dockerfile`.

Setelah layanan aktif, tambahkan environment variable backend di Vercel:

AI_SERVICE_URL=https://alamat-ai-service-anda
AI_SERVICE_API_KEY=rahasia-yang-sama-dengan-ai-service

Isi `AI_SERVICE_API_KEY` yang sama pada layanan AI-nya supaya endpoint `/scan` tidak bisa dipakai orang lain.
Cek layanan AI di `https://ALAMAT-AI-SERVICE/health`, harus mengembalikan `"status":"ok"`.

Catatan:

- Saat pengembangan lokal tidak perlu mengisi apa pun: backend otomatis memanggil `http://127.0.0.1:8000`.
- Foto resep diperkecil di browser sebelum dikirim karena Vercel membatasi body request 4,5 MB.
- Hosting gratis biasanya "tidur" saat tidak dipakai, jadi scan pertama bisa lambat (puluhan detik).
- Project Vercel lama yang belum memakai Fluid Compute bisa punya batas durasi fungsi lebih pendek.
  Bila scan sering timeout, aktifkan Fluid Compute atau atur `maxDuration` di `vercel.json`.
- Foto resep tidak disimpan di server; hanya hasil bacaan baris obat yang dicatat di `ocr_results`.

## 6. Catatan

File `server/.env` sengaja tidak disertakan dalam paket deployment. Jangan commit password database atau JWT secret ke GitHub.
