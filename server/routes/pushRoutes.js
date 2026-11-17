import express from "express";

import {
  getPublicKey,
  subscribePush,
} from "../controllers/pushController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/public-key",
  authenticate,
  getPublicKey
);

router.post(
  "/subscribe",
  authenticate,
  subscribePush
);

export default router;