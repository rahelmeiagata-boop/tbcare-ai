import {
  createLog,
  getAllLogs,
  getLogById,
  updateLog,
  deleteLog,
} from "../services/logService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const create = async (req, res) => {
  try {
    const { schedule_id, status } = req.body;

    const result = await createLog(
      schedule_id,
      status
    );

    successResponse(
      res,
      "Log konsumsi obat berhasil ditambahkan.",
      result,
      201
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await getAllLogs();

    successResponse(
      res,
      "Daftar log berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const getById = async (req, res) => {
  try {
    const result = await getLogById(
      req.params.id
    );

    successResponse(
      res,
      "Detail log berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const update = async (req, res) => {
  try {
    const { status } = req.body;

    const result = await updateLog(
      req.params.id,
      status
    );

    successResponse(
      res,
      "Log berhasil diperbarui.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const remove = async (req, res) => {
  try {
    await deleteLog(
      req.params.id
    );

    successResponse(
      res,
      "Log berhasil dihapus."
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};