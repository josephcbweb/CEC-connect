import express from "express";
import dotenv from "dotenv";
import homeRoutes from "./routes/homeRoutes";
import studentRoutes from "./routes/studentRoutes";
import feeRoutes from "./routes/feeRoutes";
import cors from "cors";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());
app.use("/", homeRoutes);
app.use("/students", studentRoutes);
app.use("/fee", feeRoutes);
app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
