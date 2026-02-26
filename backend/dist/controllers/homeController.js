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
exports.getLandingStats = void 0;
const prisma_1 = require("../lib/prisma");
const getLandingStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentCount = yield prisma_1.prisma.student.count({
            where: {
                status: {
                    notIn: ["graduated", "deleted"],
                },
            },
        });
        const facultyCount = yield prisma_1.prisma.user.count({
            where: {
                userRoles: {
                    some: {
                        role: {
                            name: {
                                in: ["hod", "faculty", "staff"],
                            },
                        },
                    },
                },
            },
        });
        const departmentCount = yield prisma_1.prisma.department.count();
        res.json({
            students: studentCount,
            faculty: facultyCount,
            departments: departmentCount,
        });
    }
    catch (error) {
        console.error("Failed to fetch landing stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getLandingStats = getLandingStats;
