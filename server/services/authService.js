import db from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";
import { MESSAGES } from "../constants/messages.js";

export const registerUser = async (userData) => {
  const {
    nama,
    email,
    password,
    nomor_hp,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    role,
  } = userData;

  // Cek email sudah terdaftar atau belum
  const [existingUser] = await db.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existingUser.length > 0) {
    throw new Error(MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user
  const [result] = await db.execute(
    `INSERT INTO users
    (nama, email, password, nomor_hp, tanggal_lahir, jenis_kelamin, alamat, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nama,
      email,
      hashedPassword,
      nomor_hp,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      role,
    ]
  );

  return {
    id: result.insertId,
    nama,
    email,
    nomor_hp,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    role,
  };
};

export const loginUser = async (email, password) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) {
    throw new Error(MESSAGES.INVALID_CREDENTIALS);
  }

  const user = rows[0];

  const match = await bcrypt.compare(
    password,
    user.password
  );

  console.log("PASSWORD INPUT :", password);
  console.log("PASSWORD HASH  :", user.password);
  console.log("MATCH :", match);

  if (!match) {
    throw new Error(MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate JWT
  const token = generateToken({
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      nomor_hp: user.nomor_hp,
      tanggal_lahir: user.tanggal_lahir,
      jenis_kelamin: user.jenis_kelamin,
      alamat: user.alamat,
      role: user.role,
    },
  };
};