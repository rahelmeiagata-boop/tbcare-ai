import api from "./api";

export const getRecommendation = async () => {
  const response = await api.get("/recommendation");
  return response.data;
};

export const saveRecommendation = async () => {
  const response = await api.post("/recommendation/save");
  return response.data;
};