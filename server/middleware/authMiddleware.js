import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.js";
import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, MESSAGES.TOKEN_REQUIRED, 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (err) {
    return errorResponse(res, MESSAGES.TOKEN_INVALID, 401);
  }
};

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "Anda tidak memiliki akses ke fitur ini.",
        403
      );
    }

    next();
  };
};

export const authorizeAdmin = authorizeRole(ROLES.ADMIN);