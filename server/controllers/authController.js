import { successResponse, errorResponse } from "../utils/response.js";
import { registerUser, loginUser } from "../services/authService.js";
import { MESSAGES } from "../constants/messages.js";

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);

    successResponse(
      res,
      MESSAGES.REGISTER_SUCCESS,
      result,
      201
    );
  } catch (err) {
    errorResponse(res, err.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    successResponse(
      res,
      MESSAGES.LOGIN_SUCCESS,
      result
    );
  } catch (err) {
  console.error(err);
  errorResponse(res, err.message);
  }
};