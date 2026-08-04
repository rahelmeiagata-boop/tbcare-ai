import express from "express";

import {
  save,
  get,
} from "../controllers/routineController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  save
);

router.get(
  "/",
  authenticate,
  get
);

export default router;