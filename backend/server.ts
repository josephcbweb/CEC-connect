import express from "express";
import dotenv from "dotenv";
import homeRoutes from "./routes/homeRoutes";
import adminRoutes from "./routes/adminRoutes";
import cors from 'cors';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/", homeRoutes);
app.use("/admin",adminRoutes);

app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
