import {
  getProfile,
  updateProfile,
} from "../services/profileService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const profile = async (
  req,
  res
) => {
  try {
    const result = await getProfile(
      req.user.id
    );

    successResponse(
      res,
      "Profil berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const update = async (
  req,
  res
) => {
  try {
    const result =
      await updateProfile(
        req.user.id,
        req.body
      );

    successResponse(
      res,
      "Profil berhasil diperbarui.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};