import {
  saveRoutine,
  getRoutine,
} from "../services/routineService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const save = async (req, res) => {
  try {

    const result = await saveRoutine(
      req.user.id,
      req.body
    );

    successResponse(
      res,
      "Rutinitas berhasil disimpan.",
      result
    );
  } catch (err) {
    console.error("Gagal menyimpan rutinitas:", err);

    errorResponse(res, err.message);
  }
};

export const get = async (req, res) => {
  try {
    const result = await getRoutine(req.user.id);

    successResponse(
      res,
      "Rutinitas berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};