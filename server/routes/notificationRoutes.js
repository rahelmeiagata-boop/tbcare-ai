import express from "express";

import {
  sendReminder,
  getMyNotifications,
  markAsRead,
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

router.patch(
  "/:id/read",
  authenticate,
  markAsRead
);

export default router;