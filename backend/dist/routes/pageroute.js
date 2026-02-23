"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pagecontroller_1 = require("../controllers/pagecontroller");
const router = express_1.default.Router();
router.get('/', pagecontroller_1.getUserNames);
exports.default = router;
