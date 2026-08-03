import {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  takeMedicine,
} from "../services/medicationService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const create = async (req, res) => {
  try {
    const result = await createMedication(
      req.user.id,
      req.body
    );

    successResponse(
      res,
      "Obat berhasil ditambahkan.",
      result,
      201
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await getAllMedications(
      req.user.id
    );

    successResponse(
      res,
      "Daftar obat berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const result = await getMedicationById(
      req.params.id,
      req.user.id
    );

    successResponse(
      res,
      "Detail obat berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const result = await updateMedication(
      req.params.id,
      req.user.id,
      req.body
    );

    successResponse(
      res,
      "Data obat berhasil diperbarui.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await deleteMedication(
      req.params.id,
      req.user.id
    );

    successResponse(
      res,
      "Data obat berhasil dihapus."
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const take = async (req, res) => {
  try {
    await takeMedicine(
      req.params.scheduleId,
      req.user.id
    );

    successResponse(
      res,
      "Obat berhasil diminum."
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};