import { errorResponse } from "./response.js";
import { MESSAGES } from "../constants/messages.js";

export const validateRegister = (req, res, next) => {
  const {
    nama,
    email,
    password,
    nomor_hp,
    tanggal_lahir,
    jenis_kelamin,
    alamat,
    role,
  } = req.body;

  if (
    !nama ||
    !email ||
    !password ||
    !nomor_hp ||
    !tanggal_lahir ||
    !jenis_kelamin ||
    !alamat ||
    !role
  ) {
    return errorResponse(
      res,
      MESSAGES.REGISTER_FIELDS_REQUIRED,
      400
    );
  }

  if (password.length < 6) {
    return errorResponse(
      res,
      MESSAGES.PASSWORD_MIN_LENGTH,
      400
    );
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(
      res,
      MESSAGES.LOGIN_FIELDS_REQUIRED,
      400
    );
  }

  if (password.length < 6) {
    return errorResponse(
      res,
      MESSAGES.PASSWORD_MIN_LENGTH,
      400
    );
  }

  next();
};