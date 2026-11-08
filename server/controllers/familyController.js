import {
  addFamily,
  getFamilies,
  deleteFamily,
  getPatient,
  searchFamily,
  getPatientCheckins,
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

// Ambil Treatment Journey pasien untuk pendamping
export const getJourney = async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return errorResponse(
        res,
        "Hanya akun pendamping yang dapat melihat riwayat pasien.",
        403
      );
    }

    const patientId = Number(req.params.patientId);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return errorResponse(res, "ID pasien tidak valid.", 400);
    }

    const result = await getPatientCheckins(
      req.user.id,
      patientId
    );

    if (result === null) {
      return errorResponse(
        res,
        "Pasien tidak terhubung dengan akun pendamping ini.",
        403
      );
    }

    return successResponse(
      res,
      "Riwayat Treatment Journey berhasil diambil.",
      result
    );
  } catch (err) {
    console.error(err);
    return errorResponse(res, err.message);
  }
};