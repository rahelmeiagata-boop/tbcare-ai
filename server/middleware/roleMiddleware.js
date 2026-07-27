import { errorResponse } from "../utils/response.js";
import { MESSAGES } from "../constants/messages.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(
        res,
        MESSAGES.ACCESS_DENIED,
        403
      );
    }

    next();
  };
};