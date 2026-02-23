"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noDueController_1 = require("../controllers/noDueController");
const router = express_1.default.Router();
router.get("/approvals", noDueController_1.getPendingApprovals);
router.post("/bulk-clear", noDueController_1.bulkClearDues);
router.post("/clear/:id", noDueController_1.clearDue);
exports.default = router;
