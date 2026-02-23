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
exports.deleteRole = exports.updateRole = exports.createRole = exports.updateRolePermissions = exports.getRolePermissions = exports.getAllRoles = void 0;
const prisma_1 = require("../lib/prisma");
// GET all roles
const getAllRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", search = "" } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        const [roles, total] = yield Promise.all([
            prisma_1.prisma.role.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            userRoles: true,
                            permissions: true,
                        },
                    },
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
                skip,
                take: limitNum,
                orderBy: { name: "asc" },
            }),
            prisma_1.prisma.role.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: roles,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching roles",
        });
    }
});
exports.getAllRoles = getAllRoles;
// GET role permissions
const getRolePermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roleId = parseInt(req.params.id);
        const role = yield prisma_1.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }
        // Type the permissions correctly
        const permissions = role.permissions.map((rp) => rp.permission);
        res.status(200).json({
            success: true,
            data: permissions,
        });
    }
    catch (error) {
        console.error("Error fetching role permissions:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching role permissions",
        });
    }
});
exports.getRolePermissions = getRolePermissions;
// POST update role permissions
const updateRolePermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roleId = parseInt(req.params.id);
        const { permissionIds } = req.body;
        if (!permissionIds || !Array.isArray(permissionIds)) {
            return res.status(400).json({
                success: false,
                message: "permissionIds array is required",
            });
        }
        // Check if role exists
        const existingRole = yield prisma_1.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }
        // Verify all permissions exist
        const permissions = yield prisma_1.prisma.permission.findMany({
            where: {
                id: {
                    in: permissionIds,
                },
            },
        });
        if (permissions.length !== permissionIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more permissions not found",
            });
        }
        // Delete existing role permissions
        yield prisma_1.prisma.rolePermission.deleteMany({
            where: { roleId },
        });
        // Create new role permissions
        if (permissionIds.length > 0) {
            const rolePermissionData = permissionIds.map((permissionId) => ({
                roleId,
                permissionId,
            }));
            yield prisma_1.prisma.rolePermission.createMany({
                data: rolePermissionData,
            });
        }
        res.status(200).json({
            success: true,
            message: "Role permissions updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating role permissions:", error);
        res.status(500).json({
            success: false,
            message: "Error updating role permissions",
        });
    }
});
exports.updateRolePermissions = updateRolePermissions;
// POST create role
const createRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Role name is required",
            });
        }
        // Check if role exists
        const existingRole = yield prisma_1.prisma.role.findUnique({
            where: { name },
        });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: "Role already exists",
            });
        }
        const role = yield prisma_1.prisma.role.create({
            data: {
                name,
                description,
            },
        });
        res.status(201).json({
            success: true,
            data: role,
            message: "Role created successfully",
        });
    }
    catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({
            success: false,
            message: "Error creating role",
        });
    }
});
exports.createRole = createRole;
// PUT update role
const updateRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roleId = parseInt(req.params.id);
        const { name, description } = req.body;
        // Check if role exists
        const existingRole = yield prisma_1.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }
        const role = yield prisma_1.prisma.role.update({
            where: { id: roleId },
            data: {
                name,
                description,
            },
        });
        res.status(200).json({
            success: true,
            data: role,
            message: "Role updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({
            success: false,
            message: "Error updating role",
        });
    }
});
exports.updateRole = updateRole;
// DELETE role
const deleteRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roleId = parseInt(req.params.id);
        // Check if role exists
        const existingRole = yield prisma_1.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                _count: {
                    select: {
                        userRoles: true,
                    },
                },
            },
        });
        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }
        // Check if role has users assigned
        if (existingRole._count.userRoles > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete role with assigned users",
            });
        }
        yield prisma_1.prisma.role.delete({
            where: { id: roleId },
        });
        res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting role",
        });
    }
});
exports.deleteRole = deleteRole;
