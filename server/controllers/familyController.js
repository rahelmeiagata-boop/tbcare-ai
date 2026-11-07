import {
  addFamily,
  getFamilies,
  deleteFamily,
  getPatient,
  searchFamily,
} from "../services/familyService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

// Tambah anggota keluarga
export const create = async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return errorResponse(
        res,
        "Hanya akun pendamping yang dapat menghubungkan pasien.",
        403
      );
    }
    const { patientId } = req.body;

    if (!patientId) {
      return errorResponse(res, "Pilih akun pasien terlebih dahulu.");
    }

    const result = await addFamily(
      req.user.id,
      patientId
    );

    successResponse(
      res,
      "Akun pasien berhasil dihubungkan.",
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

export const patient = async (req, res) => {

  try {

    const result = await getPatient(req.user.id);

    successResponse(
      res,
      "Data pasien berhasil diambil.",
      result
    );

  } catch (err) {

    errorResponse(
      res,
      err.message
    );

  }

};


export const search = async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return errorResponse(
        res,
        "Hanya akun pendamping yang dapat mencari pasien.",
        403
      );
    }
    const { keyword } = req.query;

    if (!keyword || !keyword.trim()) {
      return errorResponse(
        res,
        "Masukkan nama atau username pasien."
      );
    }

    const result = await searchFamily(
      keyword,
      req.user.id
    );

    successResponse(
      res,
      "Pencarian pasien berhasil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};