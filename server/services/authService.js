  import db from "../config/db.js";
  import bcrypt from "bcrypt";
  import { generateToken } from "../utils/jwt.js";
  import { MESSAGES } from "../constants/messages.js";

  export const registerUser = async (userData) => {
    const {
      nama,
      username,
      email,
      password,
      nomor_hp,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      role,
    } = userData;

    // Validasi username
    const cleanUsername = username?.trim().toLowerCase();

    if (!cleanUsername) {
      throw new Error("Username wajib diisi.");
    }

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      throw new Error(
        "Username harus 3-30 karakter, hanya boleh menggunakan huruf, angka, dan underscore."
      );
    }

    // Cek email
    const [existingUser] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Cek username
    const [existingUsername] = await db.execute(
      "SELECT id FROM users WHERE username = ?",
      [cleanUsername]
    );

    if (existingUsername.length > 0) {
      throw new Error("Username sudah digunakan.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user
    const [result] = await db.execute(
      `INSERT INTO users
      (nama, username, email, password, nomor_hp, tanggal_lahir, jenis_kelamin, alamat, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama,
        cleanUsername,
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
      username: cleanUsername,
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

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new Error(MESSAGES.INVALID_CREDENTIALS);
    }

    const token = generateToken({
      id: user.id,
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        nomor_hp: user.nomor_hp,
        tanggal_lahir: user.tanggal_lahir,
        jenis_kelamin: user.jenis_kelamin,
        alamat: user.alamat,
        role: user.role,
      },
    };
  };