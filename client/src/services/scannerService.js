import api from "./api";

/** Apakah layanan scan (ai-service) siap dipakai. */
export const getScannerStatus = async () => {
  const response = await api.get("/scanner/status");
  return response.data;
};

/** Kirim foto resep; mengembalikan daftar obat usulan + gambar tiap tahap image processing. */
export const scanPrescription = async (imageBlob) => {
  const form = new FormData();
  form.append("image", imageBlob, "resep.jpg");

  // Timeout longgar: layanan di hosting gratis bisa butuh waktu saat baru "bangun".
  const response = await api.post("/scanner/scan", form, { timeout: 90000 });
  return response.data;
};

/** Simpan obat yang sudah diperiksa pasien ke data obat. */
export const confirmScan = async ({ scanId, medications }) => {
  const response = await api.post("/scanner/confirm", {
    scan_id: scanId,
    medications,
  });
  return response.data;
};
