import {
  addFamily,
  getFamilies,
  deleteFamily,
} from "../services/familyService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

// Tambah anggota keluarga
export const create = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await addFamily(
      req.user.id,
      email
    );

    successResponse(
      res,
      "Anggota keluarga berhasil ditambahkan.",
      result,
      201
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// Ambil daftar keluarga
export const getAll = async (req, res) => {
  try {
    const result = await getFamilies(req.user.id);

    successResponse(
      res,
      "Daftar keluarga berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// Hapus anggota keluarga
export const remove = async (req, res) => {
  try {
    await deleteFamily(
      req.params.id,
      req.user.id
    );

    successResponse(
      res,
      "Anggota keluarga berhasil dihapus."
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};