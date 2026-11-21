import express from "express";
import { sendMessage } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, sendMessage);

export default router;