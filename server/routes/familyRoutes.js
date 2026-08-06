import express from "express";

import {
  create,
  getAll,
  remove,
} from "../controllers/familyController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  create
);

router.get(
  "/",
  authenticate,
  getAll
);

router.delete(
  "/:id",
  authenticate,
  remove
);

export default router;