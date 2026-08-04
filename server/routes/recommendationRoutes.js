import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getRecommendation,
  saveRecommendationController,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  getRecommendation
);

router.post(
  "/save",
  authenticate,
  saveRecommendationController
);

export default router;