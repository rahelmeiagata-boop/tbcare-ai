import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import routineRoutes from "./routes/routineRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/push", pushRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "TBCare API is running"
    });
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to TBCare API 🚀",
    });
});

export default app;