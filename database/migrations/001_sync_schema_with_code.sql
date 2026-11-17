-- ============================================================================
-- 001_sync_schema_with_code.sql
--
-- Menyamakan database LAMA (dibuat dari database/schema.sql versi sebelum
-- 2026-11-15) dengan kode server. Cara pakai: jalankan seluruh berkas ini pada
-- database yang dipakai backend (phpMyAdmin, MySQL Workbench, atau konsol TiDB).
--
--   * Idempoten: aman dijalankan berulang kali; langkah yang sudah beres dilewati.
--   * Tidak ada kolom/tabel/data yang dihapus (baris rutinitas ganda saja yang digabung).
--   * Tidak memakai DELIMITER maupun stored procedure.
--   * Hasil "1" (SELECT 1) pada langkah-langkah di bawah berarti langkah itu DILEWATI karena
--     sudah beres. Itu normal. Hasil akhir yang penting adalah tabel pemeriksaan di paling bawah.
--   * Tetap buat backup dulu bila database berisi data penting.
--
-- Bila database hanya berisi data uji, cara termudah: buat ulang database dari
-- database/schema.sql yang baru (sudah sama dengan hasil migrasi ini).
--
-- Yang diperbaiki:
--   users              + username (wajib, unik) dan profile_photo
--   user_routines      wake_up -> wake_time; user_id jadi unik agar simpan rutinitas
--                      benar-benar memperbarui (ON DUPLICATE KEY UPDATE)
--   medications        + consumption_schedule dan start_date
--   notifications      + is_read dan schedule_id; ENUM channel + 'web_push'
--   medication_logs    user_id/medication_id boleh NULL, taken_at default sekarang,
--                      ENUM status menjadi ('taken','late','missed')
--   daily_checkins     tabel baru (check-in harian)
--   push_subscriptions tabel baru (Web Push)
-- ============================================================================

SET SQL_SAFE_UPDATES = 0;

-- --------------------------------------------------------------------------
-- users
-- --------------------------------------------------------------------------

-- Tambah kolom username (sementara boleh NULL)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username') = 0,
  'ALTER TABLE `users` ADD COLUMN `username` varchar(30) NULL AFTER `nama`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Isi username untuk akun lama agar kolom bisa dijadikan wajib dan unik
UPDATE `users` SET `username` = CONCAT('user', `id`) WHERE `username` IS NULL OR `username` = '';

-- username menjadi wajib
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username' AND IS_NULLABLE = 'YES') > 0,
  'ALTER TABLE `users` MODIFY COLUMN `username` varchar(30) NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- username harus unik
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username' AND NON_UNIQUE = 0) = 0,
  'ALTER TABLE `users` ADD UNIQUE KEY `username` (`username`)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah profile_photo (foto profil disimpan sebagai data URL)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_photo') = 0,
  'ALTER TABLE `users` ADD COLUMN `profile_photo` longtext NULL AFTER `alamat`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------------------------
-- user_routines
-- --------------------------------------------------------------------------

-- Ganti nama wake_up -> wake_time (nama yang dipakai kode); data tetap
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'wake_up') > 0 AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'wake_time') = 0,
  'ALTER TABLE `user_routines` CHANGE COLUMN `wake_up` `wake_time` time DEFAULT NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah wake_time bila belum ada
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'wake_time') = 0,
  'ALTER TABLE `user_routines` ADD COLUMN `wake_time` time DEFAULT NULL AFTER `user_id`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Gabungkan baris rutinitas ganda per pengguna (simpan yang terbaru)
DELETE r1 FROM `user_routines` AS r1 INNER JOIN `user_routines` AS r2
  ON r1.`user_id` = r2.`user_id` AND r1.`id` < r2.`id`;

-- Ubah indeks user_id biasa menjadi unik
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND INDEX_NAME = 'user_id' AND NON_UNIQUE = 1) > 0,
  'ALTER TABLE `user_routines` DROP INDEX `user_id`, ADD UNIQUE KEY `user_id` (`user_id`)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Pastikan user_id unik
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'user_id' AND NON_UNIQUE = 0) = 0,
  'ALTER TABLE `user_routines` ADD UNIQUE KEY `user_id` (`user_id`)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------------------------
-- medications
-- --------------------------------------------------------------------------

-- Tambah consumption_schedule (daftar waktu minum, JSON)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medications' AND COLUMN_NAME = 'consumption_schedule') = 0,
  'ALTER TABLE `medications` ADD COLUMN `consumption_schedule` text NULL AFTER `consumption_rule`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah start_date (dipakai dashboard: hari terapi & riwayat 7 hari)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medications' AND COLUMN_NAME = 'start_date') = 0,
  'ALTER TABLE `medications` ADD COLUMN `start_date` date NULL AFTER `consumption_schedule`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `medications` SET `start_date` = CURDATE() WHERE `start_date` IS NULL;

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------

-- ENUM channel + 'web_push' (kode menyimpan notifikasi dengan channel web_push)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'channel' AND COLUMN_TYPE LIKE 'enum(%' AND COLUMN_TYPE NOT LIKE '%web_push%') > 0,
  'ALTER TABLE `notifications` MODIFY COLUMN `channel` enum(''whatsapp'',''telegram'',''web_push'') NOT NULL DEFAULT ''whatsapp''',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah is_read
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read') = 0,
  'ALTER TABLE `notifications` ADD COLUMN `is_read` tinyint(1) NOT NULL DEFAULT 0 AFTER `status`',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah schedule_id (mencegah pengingat ganda di hari yang sama)
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'schedule_id') = 0,
  'ALTER TABLE `notifications` ADD COLUMN `schedule_id` int NULL AFTER `user_id`, ADD KEY `schedule_id` (`schedule_id`)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------------------------
-- medication_logs
-- --------------------------------------------------------------------------

-- user_id tidak pernah diisi kode -> boleh NULL
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'user_id' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `medication_logs` MODIFY COLUMN `user_id` int NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- medication_id tidak pernah diisi kode -> boleh NULL
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'medication_id' AND IS_NULLABLE = 'NO') > 0,
  'ALTER TABLE `medication_logs` MODIFY COLUMN `medication_id` int NULL',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- taken_at default waktu sekarang
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'taken_at' AND COLUMN_DEFAULT IS NULL) > 0,
  'ALTER TABLE `medication_logs` MODIFY COLUMN `taken_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Status 1/3: perluas ENUM sementara agar nilai lama dan baru sama-sama valid
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE 'enum(%' AND COLUMN_TYPE LIKE '%tepat_waktu%' AND COLUMN_TYPE NOT LIKE '%taken%') > 0,
  'ALTER TABLE `medication_logs` MODIFY COLUMN `status` enum(''tepat_waktu'',''terlambat'',''terlewat'',''taken'',''late'',''missed'') NOT NULL DEFAULT ''taken''',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Status 2/3: ubah nilai lama ke nilai yang dipakai kode
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE '%tepat_waktu%') > 0,
  'UPDATE `medication_logs` SET `status` = CASE `status` WHEN ''tepat_waktu'' THEN ''taken'' WHEN ''terlambat'' THEN ''late'' WHEN ''terlewat'' THEN ''missed'' ELSE `status` END',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Status 3/3: ENUM final
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'status' AND COLUMN_TYPE LIKE '%tepat_waktu%') > 0,
  'ALTER TABLE `medication_logs` MODIFY COLUMN `status` enum(''taken'',''late'',''missed'') NOT NULL DEFAULT ''taken''',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- --------------------------------------------------------------------------
-- Tabel baru
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `daily_checkins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `checkin_date` date NOT NULL,
  `condition_status` varchar(50) NOT NULL,
  `complaints` text,
  `difficulty` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_checkin_date` (`user_id`,`checkin_date`),
  CONSTRAINT `daily_checkins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `endpoint` varchar(512) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `endpoint` (`endpoint`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- Pemeriksaan akhir: semua baris di bawah harus bernilai ok = 1
-- --------------------------------------------------------------------------

SELECT 'users.username' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username') > 0 AS ok
UNION ALL
SELECT 'users.profile_photo' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_photo') > 0 AS ok
UNION ALL
SELECT 'user_routines.wake_time' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'wake_time') > 0 AS ok
UNION ALL
SELECT 'medications.consumption_schedule' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medications' AND COLUMN_NAME = 'consumption_schedule') > 0 AS ok
UNION ALL
SELECT 'medications.start_date' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medications' AND COLUMN_NAME = 'start_date') > 0 AS ok
UNION ALL
SELECT 'notifications.is_read' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read') > 0 AS ok
UNION ALL
SELECT 'notifications.schedule_id' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'schedule_id') > 0 AS ok
UNION ALL
SELECT 'medication_logs.taken_at' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'taken_at') > 0 AS ok
UNION ALL
SELECT 'daily_checkins.condition_status' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_checkins' AND COLUMN_NAME = 'condition_status') > 0 AS ok
UNION ALL
SELECT 'push_subscriptions.endpoint' AS item, (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_subscriptions' AND COLUMN_NAME = 'endpoint') > 0 AS ok
UNION ALL
SELECT 'users.username unik', (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username' AND NON_UNIQUE = 0) > 0
UNION ALL
SELECT 'user_routines.user_id unik', (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_routines' AND COLUMN_NAME = 'user_id' AND NON_UNIQUE = 0) > 0
UNION ALL
SELECT 'notifications.channel + web_push', (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'channel' AND COLUMN_TYPE LIKE '%web_push%') > 0
UNION ALL
SELECT 'medication_logs.status final', (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'medication_logs' AND COLUMN_NAME = 'status' AND COLUMN_TYPE = 'enum(''taken'',''late'',''missed'')') > 0;

SET SQL_SAFE_UPDATES = 1;
