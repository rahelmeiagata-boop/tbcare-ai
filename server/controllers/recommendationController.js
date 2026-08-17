import {
  generateRecommendation,
  saveRecommendation,
} from "../services/recommendationService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const getRecommendation = async (req, res) => {

  try {

    const result =
      await generateRecommendation(req.user.id);

    successResponse(
      res,
      "Rekomendasi berhasil dibuat.",
      result
    );

  } catch (err) {

    errorResponse(res, err.message);

  }

};

export const saveRecommendationController = async (req, res) => {
  try {
    await saveRecommendation(req.user.id);

    successResponse(
      res,
      "Jadwal berhasil disimpan."
    );
  } catch (err) {
    console.log(err);

    errorResponse(
      res,
      err.message
    );
  }
};