// Klien untuk ai-service (Python: OpenCV + Tesseract).
//
// Environment variable:
//   AI_SERVICE_URL         alamat ai-service (default http://127.0.0.1:8000)
//   AI_SERVICE_API_KEY     dikirim sebagai header X-API-Key (isi bila ai-service memakainya)
//   AI_SERVICE_TIMEOUT_MS  batas waktu permintaan (default 45000)

export class AiServiceError extends Error {
  constructor(message, status = 502, code = "ai_service_error") {
    super(message);
    this.name = "AiServiceError";
    this.status = status;
    this.code = code;
  }
}

const getConfig = () => ({
  baseUrl: (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, ""),
  apiKey: process.env.AI_SERVICE_API_KEY || "",
  timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS) || 45000,
});

const isTimeout = (err) => err?.name === "TimeoutError" || err?.name === "AbortError";

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Kirim foto resep ke ai-service dan kembalikan hasil pemindaian
 * (daftar obat, teks OCR, gambar tiap tahap image processing).
 */
export const scanPrescriptionImage = async ({
  buffer,
  mimetype,
  filename,
  includeSteps = true,
}) => {
  const { baseUrl, apiKey, timeoutMs } = getConfig();

  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mimetype }), filename || "resep.jpg");
  form.append("include_steps", includeSteps ? "1" : "0");

  let response;
  try {
    response = await fetch(`${baseUrl}/scan`, {
      method: "POST",
      headers: apiKey ? { "X-API-Key": apiKey } : {},
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (isTimeout(err)) {
      throw new AiServiceError(
        "Layanan scan terlalu lama merespons. Coba lagi sebentar lagi.",
        504,
        "ai_timeout"
      );
    }
    console.error("ai-service tidak dapat dihubungi:", err.cause?.code || err.message);
    throw new AiServiceError(
      "Layanan scan resep belum dapat dihubungi. Pastikan ai-service sudah berjalan.",
      503,
      "ai_unreachable"
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const message = payload?.message || "Layanan scan mengembalikan kesalahan.";
    const code = payload?.code || "ai_service_error";

    // Gambar bermasalah (tidak valid / terlalu besar / bukan dokumen): teruskan ke pengguna.
    if ([400, 413, 422].includes(response.status)) {
      throw new AiServiceError(message, response.status, code);
    }
    // 401 berarti kunci API server dan ai-service tidak sama: masalah konfigurasi, bukan salah pengguna.
    if (response.status === 401) {
      console.error("ai-service menolak akses. Periksa AI_SERVICE_API_KEY.");
      throw new AiServiceError("Layanan scan menolak akses (konfigurasi server).", 502, "ai_unauthorized");
    }
    if (response.status === 503) {
      throw new AiServiceError(message, 503, code);
    }
    console.error(`ai-service membalas ${response.status}:`, message);
    throw new AiServiceError("Layanan scan mengalami gangguan. Coba lagi nanti.", 502, code);
  }

  if (!payload || payload.success !== true || !Array.isArray(payload.medications)) {
    throw new AiServiceError("Respons layanan scan tidak dikenali.", 502, "ai_bad_response");
  }

  return payload;
};

/** Cek singkat apakah ai-service hidup (dipakai UI untuk menampilkan peringatan dini). */
export const getAiServiceStatus = async () => {
  const { baseUrl, timeoutMs } = getConfig();

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(Math.min(timeoutMs, 5000)),
    });
    const payload = await readJson(response);

    return {
      available: response.ok && payload?.status === "ok",
      detail: payload?.error || null,
      dataset: payload?.dataset || null,
    };
  } catch {
    return { available: false, detail: "ai-service tidak dapat dihubungi", dataset: null };
  }
};
