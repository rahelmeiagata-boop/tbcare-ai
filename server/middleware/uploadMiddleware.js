import multer from "multer";

import { errorResponse } from "../utils/response.js";

export const MAX_IMAGE_MB = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  // Gambar hanya diproses lalu dibuang (tidak disimpan di server/disk).
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Format gambar harus JPG, PNG, atau WEBP."));
  },
});

/** Terima satu file pada field "image" dan ubah galat multer menjadi respons yang ramah. */
export const uploadPrescriptionImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return errorResponse(res, `Ukuran gambar melebihi ${MAX_IMAGE_MB} MB.`, 413);
    }
    return errorResponse(res, err.message || "File gambar tidak dapat dibaca.", 400);
  });
};
