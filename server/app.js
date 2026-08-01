import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import logRoutes from "./routes/logRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/logs", logRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TBCare API 🚀",
  });
});

export default app;