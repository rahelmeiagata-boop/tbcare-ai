import api from "./api";

export const saveRoutine = async (data) => {
  const response = await api.post("/routines", data);
  return response.data;
};

export const getRoutine = async () => {
  const response = await api.get("/routines");
  return response.data;
};