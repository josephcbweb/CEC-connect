import express, { urlencoded } from "express";
import dotenv from "dotenv";
import homeRoutes from "./routes/homeRoutes";
import adminRoutes from "./routes/adminRoutes";
import studentRoutes from "./routes/studentRoutes";
import userRoutes from "./routes/userRoutes";
import roleRoutes from "./routes/roleRoutes";
import permissionRoutes from "./routes/permissionRoutes";
import feeRoutes from "./routes/feeRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import authRouter from "./routes/authRouter";
import departmentRoutes from "./routes/departmentRoutes";
import admissionRoutes from "./routes/admissionRoutes";
import busRoutes from "./routes/busRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import courseRoutes from "./routes/courseRoutes";
import noDueRoutes from "./routes/noDueRoutes";
import staffRoutes from "./routes/staffRoutes";
import batchRoutes from "./routes/batchRoutes";
import promotionRoutes from "./routes/promotionRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import cors from "cors";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/", homeRoutes);
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/admin", adminRoutes);
app.use("/students", studentRoutes);
app.use("/fee", feeRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/auth", authRouter);
app.use("/api/departments", departmentRoutes);
app.use("/api/admission", admissionRoutes);
app.use("/bus", busRoutes);
app.use("/settings", settingsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/nodue", noDueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api", batchRoutes);
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
