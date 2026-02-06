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
exports.deleteServiceDepartment = exports.createServiceDepartment = exports.getServiceDepartments = exports.deleteDueConfig = exports.createDueConfig = exports.getDueConfigs = void 0;
const prisma_1 = require("../lib/prisma");
// GET /api/settings/due-configs
const getDueConfigs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const configs = yield prisma_1.prisma.dueConfiguration.findMany({
            include: { serviceDepartment: true },
            orderBy: { semester: "asc" },
        });
        res.json(configs);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch configs", error: error.message });
    }
});
exports.getDueConfigs = getDueConfigs;
// POST /api/settings/due-configs
const createDueConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { semester, serviceDepartmentId, name, dueDate } = req.body;
        // Check if exists to prevent 500 on unique constraint
        const existing = yield prisma_1.prisma.dueConfiguration.findFirst({
            where: {
                semester: Number(semester),
                serviceDepartmentId: serviceDepartmentId
                    ? Number(serviceDepartmentId)
                    : null,
                name: name || null,
            },
        });
        if (existing) {
            res.status(400).json({ message: "Configuration already exists" });
            return;
        }
        const config = yield prisma_1.prisma.dueConfiguration.create({
            data: {
                semester: Number(semester),
                serviceDepartmentId: serviceDepartmentId
                    ? Number(serviceDepartmentId)
                    : null,
                name,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });
        res.status(201).json(config);
    }
    catch (error) {
        console.error("Error creating due config:", error);
        res
            .status(500)
            .json({ message: "Failed to create config", error: error.message });
    }
});
exports.createDueConfig = createDueConfig;
// DELETE /api/settings/due-configs/:id
const deleteDueConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.dueConfiguration.delete({ where: { id: Number(id) } });
        res.json({ message: "Config deleted" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to delete config", error: error.message });
    }
});
exports.deleteDueConfig = deleteDueConfig;
// GET /api/settings/service-departments
const getServiceDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const depts = yield prisma_1.prisma.serviceDepartment.findMany();
        res.json(depts);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch departments", error: error.message });
    }
});
exports.getServiceDepartments = getServiceDepartments;
// POST /api/settings/service-departments
const createServiceDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, code } = req.body;
        const dept = yield prisma_1.prisma.serviceDepartment.create({
            data: { name, code },
        });
        res.status(201).json(dept);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to create department", error: error.message });
    }
});
exports.createServiceDepartment = createServiceDepartment;
// DELETE /api/settings/service-departments/:id
const deleteServiceDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if used in any configs or dues
        // Prisma will throw error if foreign key constraint fails, which is good.
        yield prisma_1.prisma.serviceDepartment.delete({ where: { id: Number(id) } });
        res.json({ message: "Department deleted" });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to delete department. It might be in use.",
            error: error.message,
        });
    }
});
exports.deleteServiceDepartment = deleteServiceDepartment;
