import express from "express";

import {
  subscribePush,
} from "../controllers/pushController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/subscribe",
  authenticate,
  subscribePush
);

export default router;