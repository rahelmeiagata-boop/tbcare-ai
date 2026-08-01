import db from "../config/db.js";

export const getProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
      id,
      nama,
      email,
      nomor_hp,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      role,
      created_at
    FROM users
    WHERE id = ?`,
    [userId]
  );

  return rows[0];
};

export const updateProfile = async (
  userId,
  data
) => {
  const {
    nama,
    nomor_hp,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
  } = data;

  await db.execute(
    `UPDATE users
     SET
      nama=?,
      nomor_hp=?,
      tanggal_lahir=?,
      jenis_kelamin=?,
      alamat=?
     WHERE id=?`,
    [
      nama,
      nomor_hp,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      userId,
    ]
  );

  return await getProfile(userId);
};