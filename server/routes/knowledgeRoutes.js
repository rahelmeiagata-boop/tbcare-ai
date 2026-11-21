import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import uploadKnowledge from "../middleware/knowledgeUpload.js";
import { uploadDocument } from "../controllers/knowledgeController.js";

const router = express.Router();

// Semua endpoint wajib login dan hanya admin yang boleh mengakses.
router.use(authenticate, requireAdmin);

// Upload dokumen PDF
router.post("/upload", uploadKnowledge.array("files", 10), uploadDocument);
export default router;