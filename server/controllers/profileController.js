import {
  getProfile,
  updateProfile,
} from "../services/profileService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const profile = async (req, res) => {
  try {
    const result = await getProfile(req.user.id);

    successResponse(
      res,
      "Profil berhasil diambil.",
      result
    );
  } catch (err) {
    console.error("❌ ERROR GET PROFILE:", err);

    errorResponse(
      res,
      err.message || "Gagal mengambil profil."
    );
  }
};

export const update = async (req, res) => {
  try {
    console.log("📥 DATA UPDATE PROFILE:", req.body);
    console.log("👤 USER ID:", req.user.id);

    const result = await updateProfile(
      req.user.id,
      req.body
    );

    console.log("✅ PROFILE UPDATED:", result);

    successResponse(
      res,
      "Profil berhasil diperbarui.",
      result
    );
  } catch (err) {
    console.error("❌ ERROR UPDATE PROFILE:", err);

    errorResponse(
      res,
      err.message || "Gagal memperbarui profil."
    );
  }
};