import db from "../config/db.js";

// Tambah anggota keluarga berdasarkan email
export const addFamily = async (patientId, email) => {
  // Cari user berdasarkan email
  const [users] = await db.execute(
    `
    SELECT id, nama, email
    FROM users
    WHERE email = ?
    `,
    [email]
  );

  if (users.length === 0) {
    throw new Error("Akun keluarga tidak ditemukan.");
  }

  const family = users[0];

  // Tidak boleh menambahkan diri sendiri
  if (family.id === patientId) {
    throw new Error("Tidak dapat menambahkan akun sendiri.");
  }

  // Cek apakah sudah terhubung
  const [exists] = await db.execute(
    `
    SELECT id
    FROM family_connections
    WHERE patient_id = ?
    AND family_id = ?
    `,
    [patientId, family.id]
  );

  if (exists.length > 0) {
    throw new Error("Anggota keluarga sudah ditambahkan.");
  }

  // Simpan relasi
  await db.execute(
    `
    INSERT INTO family_connections
    (
      patient_id,
      family_id
    )
    VALUES
    (
      ?,
      ?
    )
    `,
    [patientId, family.id]
  );

  return family;
};

// Ambil daftar keluarga
export const getFamilies = async (patientId) => {
  const [rows] = await db.execute(
    `
    SELECT
      fc.id,
      u.id AS family_id,
      u.nama,
      u.email
    FROM family_connections fc
    JOIN users u
      ON fc.family_id = u.id
    WHERE fc.patient_id = ?
    ORDER BY u.nama
    `,
    [patientId]
  );

  return rows;
};

// Hapus anggota keluarga
export const deleteFamily = async (connectionId, patientId) => {
  await db.execute(
    `
    DELETE FROM family_connections
    WHERE id = ?
    AND patient_id = ?
    `,
    [connectionId, patientId]
  );
};