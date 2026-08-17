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
      profile_photo,
      created_at
    FROM users
    WHERE id = ?`,
    [userId]
  );

  return rows[0];
};

export const updateProfile = async (userId, data) => {
  const {
    nama,
    email,
    nomor_hp,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    profile_photo,
  } = data;

  const tanggalLahirValue =
    tanggal_lahir && tanggal_lahir.trim() !== ""
      ? tanggal_lahir
      : null;

  let query;
  let values;

  if (profile_photo) {
    query = `
      UPDATE users
      SET
        nama=?,
        email=?,
        nomor_hp=?,
        tanggal_lahir=?,
        jenis_kelamin=?,
        alamat=?,
        profile_photo=?
      WHERE id=?
    `;

    values = [
      nama,
      email,
      nomor_hp,
      tanggalLahirValue,
      jenis_kelamin,
      alamat,
      profile_photo,
      userId,
    ];
  } else {
    query = `
      UPDATE users
      SET
        nama=?,
        email=?,
        nomor_hp=?,
        tanggal_lahir=?,
        jenis_kelamin=?,
        alamat=?
      WHERE id=?
    `;

    values = [
      nama,
      email,
      nomor_hp,
      tanggalLahirValue,
      jenis_kelamin,
      alamat,
      userId,
    ];
  }

  await db.execute(query, values);

  return await getProfile(userId);
};