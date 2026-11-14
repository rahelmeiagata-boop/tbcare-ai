import {
  AiServiceError,
  getAiServiceStatus,
  scanPrescriptionImage,
} from "../services/aiService.js";

import {
  ScannerInputError,
  confirmScannedMedications,
  saveScanRecord,
} from "../services/scannerService.js";

import { successResponse, errorResponse } from "../utils/response.js";
import { MESSAGES } from "../constants/messages.js";

/** GET /api/scanner/status: apakah layanan scan (ai-service) siap dipakai. */
export const status = async (req, res) => {
  const result = await getAiServiceStatus();

  successResponse(
    res,
    result.available ? "Layanan scan siap." : "Layanan scan belum tersedia.",
    result
  );
};

/** POST /api/scanner/scan: foto resep -> daftar obat usulan (belum disimpan). */
export const scan = async (req, res) => {
  if (!req.file) {
    return errorResponse(res, "Pilih atau foto resep terlebih dahulu.", 400);
  }

  try {
    const result = await scanPrescriptionImage({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
      includeSteps: req.query.steps !== "0",
    });

    const scanId = await saveScanRecord(req.user.id, req.file.originalname, result);

    return successResponse(res, "Resep berhasil dipindai.", {
      scan_id: scanId,
      ...result,
    });
  } catch (err) {
    if (err instanceof AiServiceError) {
      return errorResponse(res, err.message, err.status);
    }

    console.error("Scan resep gagal:", err);
    return errorResponse(res, MESSAGES.SERVER_ERROR);
  }
};

/** POST /api/scanner/confirm: simpan obat yang sudah diperiksa pasien ke data obat. */
export const confirm = async (req, res) => {
  try {
    const raw = req.body?.scan_id;
    const parsed = Number.isInteger(raw) ? raw : /^\d+$/.test(String(raw ?? "")) ? Number(raw) : null;
    const scanId = parsed && parsed > 0 ? parsed : null;

    const { created, failed } = await confirmScannedMedications(req.user.id, {
      scanId,
      medications: req.body?.medications,
    });

    if (created.length === 0) {
      return errorResponse(res, "Obat gagal disimpan. Silakan coba lagi.", 500);
    }

    const message =
      failed.length > 0
        ? `${created.length} obat tersimpan, ${failed.length} obat gagal disimpan.`
        : `${created.length} obat berhasil disimpan ke Obat Saya.`;

    return successResponse(res, message, { created, failed }, 201);
  } catch (err) {
    if (err instanceof ScannerInputError) {
      return errorResponse(res, err.message, err.status);
    }

    console.error("Konfirmasi scan gagal:", err);
    return errorResponse(res, MESSAGES.SERVER_ERROR);
  }
};
