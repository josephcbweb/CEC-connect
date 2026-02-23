"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.updateCourse = exports.getStudentCourses = exports.createCourse = exports.getAllCourses = void 0;
const prisma_1 = require("../lib/prisma");
const getAllCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield prisma_1.prisma.course.findMany({
            include: { department: true },
            orderBy: { code: "asc" },
        });
        res.json(courses);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch courses", error: error.message });
    }
});
exports.getAllCourses = getAllCourses;
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, code, type, category, departmentId, semester, staffId } = req.body;
        if (!staffId) {
            res.status(400).json({ message: "Staff assignment is mandatory" });
            return;
        }
        const existingCourse = yield prisma_1.prisma.course.findUnique({
            where: { code },
        });
        if (existingCourse) {
            res.status(400).json({ message: "Course code already exists" });
            return;
        }
        const course = yield prisma_1.prisma.course.create({
            data: {
                name,
                code,
                type,
                category: type === "LAB" ? null : category,
                department: {
                    connect: { id: parseInt(departmentId) },
                },
                semester: parseInt(semester),
                isActive: true,
                staff: {
                    connect: { id: parseInt(staffId) },
                },
            },
        });
        res.status(201).json(course);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to create course", error: error.message });
    }
});
exports.createCourse = createCourse;
const getStudentCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semester } = req.query;
        // In a real app, we might filter by student's department too.
        // For now, just return active courses for the semester.
        const whereClause = { isActive: true };
        if (semester) {
            whereClause.semester = parseInt(semester);
        }
        const courses = yield prisma_1.prisma.course.findMany({
            where: whereClause,
            include: { department: true },
        });
        res.json(courses);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch student courses",
            error: error.message,
        });
    }
});
exports.getStudentCourses = getStudentCourses;
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, code, type, category, departmentId, semester, staffId, isActive, } = req.body;
        if (!staffId) {
            res.status(400).json({ message: "Staff assignment is mandatory" });
            return;
        }
        // Check if another course with the same code already exists
        const existingCourse = yield prisma_1.prisma.course.findFirst({
            where: {
                code,
                id: { not: parseInt(id) },
            },
        });
        if (existingCourse) {
            res.status(400).json({ error: "A course with this code already exists" });
            return;
        }
        const course = yield prisma_1.prisma.course.update({
            where: { id: parseInt(id) },
            data: {
                name,
                code,
                type,
                category: type === "LAB" ? null : category,
                department: {
                    connect: { id: parseInt(departmentId) },
                },
                semester: parseInt(semester),
                isActive: isActive !== undefined ? isActive : true,
                staff: {
                    connect: { id: parseInt(staffId) },
                },
            },
        });
        res.json(course);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to update course", error: error.message });
    }
});
exports.updateCourse = updateCourse;
const deleteCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.course.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: "Course deleted successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to delete course", error: error.message });
    }
});
exports.deleteCourse = deleteCourse;
