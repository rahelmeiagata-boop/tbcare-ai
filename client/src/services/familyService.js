import api from "./api";

export const getFamilies = async () => {
  const response = await api.get("/family");
  return response.data;
};

export const addFamily = async (email) => {
  const response = await api.post("/family", {
    email,
  });

  return response.data;
};

export const deleteFamily = async (id) => {
  const response = await api.delete(`/family/${id}`);
  return response.data;
};

export const getPatient = async () => {
  const response = await api.get(
    "/family/patient"
  );

  return response.data;
};

export const getFamilyDashboard = async () => {

  const response = await api.get(
    "/dashboard/family"
  );

  return response.data;

};