import api from "./api";

export const createLog = async (scheduleId) => {
  const response = await api.post(
    `/medications/take/${scheduleId}`
  );

  return response.data;
};