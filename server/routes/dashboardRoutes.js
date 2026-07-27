import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(ROLES.PATIENT, ROLES.DOCTOR),
  getDashboard
);

export default router;