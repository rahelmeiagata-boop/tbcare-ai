-- ============================================================================
-- dev_seed.sql — akun uji untuk PENGEMBANGAN LOKAL SAJA.
-- JANGAN dijalankan di database produksi (password-nya diketahui publik).
--
-- Membuat dua akun, keduanya berpassword  Tes12345
--   Pasien     : pasien.uji@example.com      (username: pasien_uji)
--   Pendamping : pendamping.uji@example.com  (username: pendamping_uji)
-- lalu menghubungkan pendamping ke pasien dan mengisi rutinitas harian pasien
-- (supaya jadwal pengingat obat langsung terbentuk).
--
-- Prasyarat: schema.sql terbaru (atau migrations/001_sync_schema_with_code.sql).
-- Aman dijalankan berulang kali.
-- ============================================================================

INSERT INTO users (nama, username, email, password, nomor_hp, jenis_kelamin, role) VALUES
  ('Pasien Uji',     'pasien_uji',     'pasien.uji@example.com',     '$2b$10$AdL19sxPtWA1Llyg1Gh73eyULsAaAboTVcWBhqFJbD8lzkPW/HwZ2', '081234567890', 'L', 'patient'),
  ('Pendamping Uji', 'pendamping_uji', 'pendamping.uji@example.com', '$2b$10$AdL19sxPtWA1Llyg1Gh73eyULsAaAboTVcWBhqFJbD8lzkPW/HwZ2', '081234567891', 'P', 'family')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

INSERT INTO user_routines (user_id, wake_time, breakfast_time, lunch_time, dinner_time, sleep_time)
SELECT id, '06:00:00', '07:00:00', '12:00:00', '19:00:00', '22:00:00'
FROM users WHERE email = 'pasien.uji@example.com'
ON DUPLICATE KEY UPDATE wake_time = VALUES(wake_time);

INSERT INTO family_connections (patient_id, family_id)
SELECT p.id, f.id
FROM users p JOIN users f
WHERE p.email = 'pasien.uji@example.com' AND f.email = 'pendamping.uji@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM family_connections fc WHERE fc.patient_id = p.id AND fc.family_id = f.id
  );
