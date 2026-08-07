import express from "express";

import {
  sendReminder,
  getMyNotifications,
} from "../controllers/notificationController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  sendReminder
);

router.get(
  "/",
  authenticate,
  getMyNotifications
);

export default router;