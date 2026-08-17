import api from "./api";

export const getMedications = async () => {
  const response = await api.get("/medications");
  return response.data;
};

export const createMedication = async (data) => {
  const response = await api.post("/medications", data);
  return response.data;
};

export const updateMedication = async (id, data) => {
  const response = await api.put(`/medications/${id}`, data);
  return response.data;
};

export const deleteMedication = async (id) => {
  const response = await api.delete(`/medications/${id}`);
  return response.data;
};

export const getMedicationById = async (id) => {
  const response = await api.get(`/medications/${id}`);
  return response.data;
};