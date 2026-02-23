"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noDueController_1 = require("../controllers/noDueController");
const router = express_1.default.Router();
router.post("/register", noDueController_1.registerSemester);
router.get("/status", noDueController_1.getStudentStatus);
router.post("/bulk-initiate", noDueController_1.bulkInitiateNoDue);
router.post("/bulk-initiate-check", noDueController_1.bulkInitiateCheck);
router.post("/send-emails", noDueController_1.sendPendingEmails);
exports.default = router;
