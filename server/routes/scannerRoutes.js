import express from "express";

import { scan, confirm, status } from "../controllers/scannerController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { uploadPrescriptionImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/status", authenticate, status);

router.post("/scan", authenticate, uploadPrescriptionImage, scan);

router.post("/confirm", authenticate, confirm);

export default router;
