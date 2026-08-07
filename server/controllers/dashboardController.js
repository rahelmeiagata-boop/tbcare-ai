import {
  getDashboardData,
  getFamilyDashboardData,
} from "../services/dashboardService.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const getDashboard = async (req, res) => {
  try {

    const result = await getDashboardData(
      req.user.id
    );

    successResponse(
      res,
      "Dashboard berhasil diambil.",
      result
    );

  } catch (err) {

    errorResponse(
      res,
      err.message
    );

  }
};

export const getFamilyDashboardController = async (
  req,
  res
) => {

  try {

    const result =
      await getFamilyDashboardData(
        req.user.id
      );

    successResponse(
      res,
      "Dashboard pendamping berhasil diambil.",
      result
    );

  } catch (err) {

    errorResponse(
      res,
      err.message
    );

  }

};