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

## 5. Catatan

File `server/.env` sengaja tidak disertakan dalam paket deployment. Jangan commit password database atau JWT secret ke GitHub.
