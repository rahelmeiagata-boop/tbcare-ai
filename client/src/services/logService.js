import api from "./api";

export const createLog = async (
  schedule_id,
  status = "taken"
) => {
  const response = await api.post(
    "/logs",
    {
      schedule_id,
      status,
    }
  );

  return response.data;
};