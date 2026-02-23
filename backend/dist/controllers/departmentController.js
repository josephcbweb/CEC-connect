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
exports.getEligibleFaculty = exports.updateDepartmentHod = exports.deleteDepartment = exports.addDepartment = exports.getDepartment = void 0;
const prisma_1 = require("../lib/prisma");
const getDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { program } = req.query;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause = {};
        if (program && program !== "all") {
            whereClause.program = program;
        }
        const departments = yield prisma_1.prisma.department.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                hodDetails: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(departments);
    }
    catch (error) {
        console.error("GET DEPT ERROR:", error);
        res.status(500).json({ message: "Failed to fetch departments" });
    }
});
exports.getDepartment = getDepartment;
const addDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, code, hodId, program } = req.body;
        if (!name || !code) {
            return res.status(400).json({ message: "Name and Code are required" });
        }
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create Department
            const department = yield tx.department.create({
                data: {
                    name,
                    department_code: code,
                    hodId: hodId ? Number(hodId) : null,
                    program: program || "BTECH",
                },
            });
            // If HOD is assigned, create HodDetails
            if (hodId) {
                yield tx.hodDetails.create({
                    data: {
                        userId: Number(hodId),
                        departmentId: department.id,
                    },
                });
            }
            return department;
        }));
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "A department with this name or code already exists in the selected program." });
        }
        res.status(400).json({ message: "Failed to create department", error });
    }
});
exports.addDepartment = addDepartment;
const deleteDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete HodDetails first (if exists)
            yield tx.hodDetails.deleteMany({
                where: { departmentId: Number(id) },
            });
            // Delete Department
            yield tx.department.delete({
                where: { id: Number(id) },
            });
        }));
        res.json({ message: "Department deleted successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: "Failed to delete department. It may not exist.",
        });
    }
});
exports.deleteDepartment = deleteDepartment;
const updateDepartmentHod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { hodId } = req.body; // New HOD User ID
        if (!hodId) {
            return res.status(400).json({ message: "HOD ID is required" });
        }
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const deptId = Number(id);
            const newHodId = Number(hodId);
            // 1. Remove existing HOD details for this department
            yield tx.hodDetails.deleteMany({
                where: { departmentId: deptId },
            });
            // 2. Update Department record
            yield tx.department.update({
                where: { id: deptId },
                data: { hodId: newHodId },
            });
            // 3. Create new HodDetails
            yield tx.hodDetails.create({
                data: {
                    userId: newHodId,
                    departmentId: deptId,
                },
            });
        }));
        res.json({ message: "HOD updated successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to update HOD", error });
    }
});
exports.updateDepartmentHod = updateDepartmentHod;
const getEligibleFaculty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Find role ID for 'Faculty'
        const facultyRole = yield prisma_1.prisma.role.findUnique({
            where: { name: "faculty" },
        });
        if (!facultyRole) {
            return res.status(404).json({ message: "Faculty role not found" });
        }
        // 2. Find eligible users:
        //    - Have 'Faculty' role
        //    - NOT present in HodDetails
        const eligibleUsers = yield prisma_1.prisma.user.findMany({
            where: {
                userRoles: {
                    some: {
                        roleId: facultyRole.id,
                    },
                },
                hodDetails: {
                    is: null, // Ensure they are not currently an HOD
                },
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });
        res.json(eligibleUsers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch eligible faculty" });
    }
});
exports.getEligibleFaculty = getEligibleFaculty;
