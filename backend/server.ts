import express from "express";
import dotenv from "dotenv";
import homeRoutes from "./routes/homeRoutes";
import adminRoutes from "./routes/adminRoutes";
import studentRoutes from "./routes/studentRoutes";
import feeRoutes from "./routes/feeRoutes";
<<<<<<< HEAD
import certificateRoutes from './routes/certificateRoutes';
=======
import authRouter from "./routes/authRouter";
>>>>>>> 3db0e6507ee6b533567e050507891dd314d8468c
import cors from "cors";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());
app.use("/", homeRoutes);
app.use("/admin",adminRoutes);

app.use("/students", studentRoutes);
app.use("/fee", feeRoutes);
<<<<<<< HEAD
app.use("/api", certificateRoutes);
=======
app.use("/auth", authRouter);
>>>>>>> 3db0e6507ee6b533567e050507891dd314d8468c
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
