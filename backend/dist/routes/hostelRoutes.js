"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hostelController_1 = require("../controllers/hostelController");
const router = express_1.default.Router();
//route for creating a hostel.
router.post("/createHostel", hostelController_1.createHostel);
//route for adding a student to a hostel.
router.patch("/addStudents", hostelController_1.assignStudentToHostel);
//route for fetching students in a hostel.
router.get("/fetchStudents/:id", hostelController_1.getHostelStudents);
//route for fetching all hostels.
router.get("/fetchHostels", hostelController_1.getAllHostels);
//route for updating warden name.
router.patch('/updateWarden/:id', hostelController_1.updateWarden);
//route for updating rent.
router.patch('/updateRent/:id', hostelController_1.updateRent);
// Bulk generate monthly rent
router.post('/generate-invoices', hostelController_1.generateMonthlyInvoices);
// Vacate student with due-check
router.patch('/vacate/:studentId', hostelController_1.vacateStudent);
// Get ledger for a student
router.get('/ledger/:studentId', hostelController_1.getStudentHostelLedger);
exports.default = router;
