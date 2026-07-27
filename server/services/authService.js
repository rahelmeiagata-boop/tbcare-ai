import { generateToken } from "../utils/jwt.js";

export const registerUser = async (userData) => {
  return {
    id: 1,
    fullname: userData.fullname,
    email: userData.email,
    role: "patient",
  };
};

export const loginUser = async (email, password) => {
  const user = {
    id: 1,
    fullname: "Demo Patient",
    email,
    role: "patient",
  };

  const token = generateToken(user);

  return {
    token,
    user,
  };
};