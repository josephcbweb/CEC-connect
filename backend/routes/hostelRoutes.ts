import express from "express";
import { Router } from "express";

import {
    createHostel,
    assignStudentToHostel,
    getHostelStudents,
    getAllHostels,
} from "../controllers/hostelController";

const router = express.Router();

//route for creating a hostel.
router.post("/createHostel", createHostel);

//route for adding a student to a hostel.
router.patch("/addStudents", assignStudentToHostel);

//route for fetching students in a hostel.
router.get("/fetchStudents/:id", getHostelStudents);

//route for fetching all hostels.
router.get("/fetchHostels", getAllHostels);

export default router;