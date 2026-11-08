import express from "express";

import {
  create,
  getAll,
  remove,
  patient,
  search,
  getJourney,
} from "../controllers/familyController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/search", authenticate, search);
router.get("/", authenticate, getAll);
router.post("/", authenticate, create);
router.get("/patient", authenticate, patient);
router.delete("/:id", authenticate, remove);
router.get(
  "/patient/:patientId/journey",
  authenticate,
  getJourney
);

export default router;