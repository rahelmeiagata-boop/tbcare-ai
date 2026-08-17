import express from "express";

import {
  profile,
  update,
} from "../controllers/profileController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  profile
);

router.put(
  "/",
  authenticate,
  update
);

export default router;