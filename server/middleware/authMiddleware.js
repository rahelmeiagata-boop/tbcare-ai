import { verifyToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/response.js";
import { MESSAGES } from "../constants/messages.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, MESSAGES.TOKEN_REQUIRED, 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    return errorResponse(res, MESSAGES.TOKEN_INVALID, 401);
  }
};