import { getDashboardData } from "../services/dashboardService.js";
import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

export const getDashboard = async (req, res) => {
  try {
    const result = await getDashboardData(req.user.id);

    successResponse(
      res,
      "Dashboard berhasil diambil.",
      result
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};