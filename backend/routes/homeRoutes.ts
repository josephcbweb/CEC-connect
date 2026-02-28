import express from "express";
import { getLandingStats } from "../controllers/homeController";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("This is the homepage our app. Wohoo...");
});

router.get("/stats", getLandingStats);

export default router;
