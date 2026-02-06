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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getAllUsers = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
// GET all users (staff)
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", search = "", status = "" } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [users, total] = yield Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    advisorDetails: true,
                    hodDetails: true,
                    principalDetails: true,
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching users",
        });
    }
});
exports.getAllUsers = getAllUsers;
// POST create user
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, roleIds, status = "active" } = req.body;
        if (!username || !email || !password || !roleIds) {
            return res.status(400).json({
                success: false,
                message: "Username, email, password, and roleIds are required",
            });
        }
        // Check if user exists
        const existingUser = yield prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or email already exists",
            });
        }
        // Hash password
        const salt = yield bcrypt_1.default.genSalt(10);
        const passwordHash = yield bcrypt_1.default.hash(password, salt);
        // Create user with roles
        const user = yield prisma_1.prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                status,
                userRoles: {
                    create: roleIds.map((roleId) => ({
                        roleId,
                    })),
                },
            },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        // Remove password hash from response
        const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: "User created successfully",
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: "Error creating user",
        });
    }
});
exports.createUser = createUser;
// PUT update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        const { username, email, password, roleIds, status } = req.body;
        // Check if user exists
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const updateData = {
            username,
            email,
            status,
        };
        // Update password if provided
        if (password) {
            const salt = yield bcrypt_1.default.genSalt(10);
            updateData.passwordHash = yield bcrypt_1.default.hash(password, salt);
        }
        // Update user
        const user = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        // Update roles if provided
        if (roleIds && Array.isArray(roleIds)) {
            // Delete existing roles
            yield prisma_1.prisma.userRole.deleteMany({
                where: { userId },
            });
            // Create new roles
            if (roleIds.length > 0) {
                yield prisma_1.prisma.userRole.createMany({
                    data: roleIds.map((roleId) => ({
                        userId,
                        roleId,
                    })),
                });
            }
            // Fetch updated user with roles
            const updatedUser = yield prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            // Remove password hash from response
            const _a = updatedUser, { passwordHash: _ } = _a, userWithoutPassword = __rest(_a, ["passwordHash"]);
            return res.status(200).json({
                success: true,
                data: userWithoutPassword,
                message: "User updated successfully",
            });
        }
        // Remove password hash from response
        const { passwordHash: _ } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
        res.status(200).json({
            success: true,
            data: userWithoutPassword,
            message: "User updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            success: false,
            message: "Error updating user",
        });
    }
});
exports.updateUser = updateUser;
// DELETE user (soft delete - set to inactive)
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.params.id);
        // Check if user exists
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Soft delete - set status to inactive
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { status: "inactive" },
        });
        res.status(200).json({
            success: true,
            message: "User deactivated successfully",
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting user",
        });
    }
});
exports.deleteUser = deleteUser;
