import { errorResponse } from "../utils/response.js";

export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return errorResponse(
            res,
            "Akses hanya untuk admin.",
            403
        );
    }

    next();
};