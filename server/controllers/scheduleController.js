import {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../services/scheduleService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const create = async (req, res) => {
  try {
    const { medication_id, scheduled_time } = req.body;

    const result = await createSchedule(
      medication_id,
      scheduled_time
    );

    successResponse(
      res,
      "Jadwal obat berhasil ditambahkan.",
      result,
      201
    );
  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await getAllSchedules(
      req.user.id
    );

    successResponse(
      res,
      "Daftar jadwal berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};

export const getById = async (req, res) => {
  try {
    const result = await getScheduleById(
      req.params.id
    );

    successResponse(
      res,
      "Detail jadwal berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};

export const update = async (req, res) => {
  try {
    const { scheduled_time } = req.body;

    const result = await updateSchedule(
      req.params.id,
      scheduled_time
    );

    successResponse(
      res,
      "Jadwal berhasil diperbarui.",
      result
    );
  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};

export const remove = async (req, res) => {
  try {
    await deleteSchedule(
      req.params.id
    );

    successResponse(
      res,
      "Jadwal berhasil dihapus."
    );
  } catch (err) {
    errorResponse(
      res,
      err.message
    );
  }
};