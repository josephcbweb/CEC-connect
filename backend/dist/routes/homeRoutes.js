"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const homeController_1 = require("../Controllers/homeController");
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.send("This is the homepage our app. Wohoo...");
});
router.get("/stats", homeController_1.getLandingStats);
exports.default = router;
