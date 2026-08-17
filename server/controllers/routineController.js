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

    console.log("========== SAVE ROUTINE ==========");
    console.log("REQ.USER =", req.user);
    console.log("REQ.BODY =", req.body);

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
    console.log("ERROR =", err);

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