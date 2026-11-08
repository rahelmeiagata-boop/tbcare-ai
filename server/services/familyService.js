import db from "../config/db.js";

// Tambah anggota keluarga berdasarkan ID akun
export const addFamily = async (familyId, patientId) => {
  const [users] = await db.execute(
    `
    SELECT id, nama, username, email, role
    FROM users
    WHERE id = ?
    AND role = 'patient'
    `,
    [patientId]
  );

  if (users.length === 0) {
    throw new Error("Akun pasien tidak ditemukan.");
  }

  const patient = users[0];

  const [exists] = await db.execute(
    `
    SELECT id
    FROM family_connections
    WHERE patient_id = ?
    AND family_id = ?
    `,
    [patient.id, familyId]
  );

  if (exists.length > 0) {
    throw new Error("Akun pasien sudah terhubung.");
  }

  await db.execute(
    `
    INSERT INTO family_connections
    (patient_id, family_id)
    VALUES (?, ?)
    `,
    [patient.id, familyId]
  );

  return patient;
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
    JOIN users u ON fc.family_id = u.id
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

// Ambil data pasien yang terhubung dengan pendamping
export const getPatient = async (familyId) => {
  const [rows] = await db.execute(
    `
    SELECT
      u.id,
      u.nama,
      u.email,
      u.nomor_hp
    FROM family_connections fc
    JOIN users u ON fc.patient_id = u.id
    WHERE fc.family_id = ?
    LIMIT 1
    `,
    [familyId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

// Cari akun pasien
export const searchFamily = async (keyword, familyId) => {
  const search = `%${keyword.trim()}%`;

  const [rows] = await db.execute(
    `
    SELECT
      u.id,
      u.nama,
      u.username,
      u.email,
      u.role,
      EXISTS (
        SELECT 1
        FROM family_connections fc
        WHERE fc.patient_id = u.id
        AND fc.family_id = ?
      ) AS is_connected
    FROM users u
    WHERE u.role = 'patient'
      AND (
        u.nama LIKE ?
        OR u.username LIKE ?
      )
    ORDER BY u.nama ASC
    LIMIT 10
    `,
    [familyId, search, search]
  );

  return rows;
};

// Ambil riwayat Treatment Journey pasien untuk pendamping
export const getPatientCheckins = async (familyId, patientId) => {
  // Pastikan pasien terhubung dengan pendamping
  const [connections] = await db.execute(
    `
    SELECT id
    FROM family_connections
    WHERE family_id = ?
      AND patient_id = ?
    `,
    [familyId, patientId]
  );

  if (connections.length === 0) {
    return null;
  }

  // Ambil riwayat check-in pasien
  const [rows] = await db.execute(
    `
    SELECT
      id,
      DATE_FORMAT(checkin_date, '%Y-%m-%d') AS date,
      condition_status AS \`condition\`,
      complaints,
      difficulty,
      notes,
      created_at AS createdAt
    FROM daily_checkins
    WHERE user_id = ?
    ORDER BY checkin_date DESC
    `,
    [patientId]
  );

  return rows;
};