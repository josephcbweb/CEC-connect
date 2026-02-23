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
exports.deletePermission = exports.updatePermission = exports.createPermission = exports.getAllPermissions = void 0;
const prisma_1 = require("../lib/prisma");
// GET all permissions
const getAllPermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '10', search = '', module: moduleFilter = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { moduleName: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (moduleFilter) {
            where.moduleName = moduleFilter;
        }
        const [permissions, total] = yield Promise.all([
            prisma_1.prisma.permission.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            roles: true
                        }
                    }
                },
                skip,
                take: limitNum,
                orderBy: [
                    { moduleName: 'asc' },
                    { name: 'asc' }
                ]
            }),
            prisma_1.prisma.permission.count({ where })
        ]);
        res.status(200).json({
            success: true,
            data: permissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions'
        });
    }
});
exports.getAllPermissions = getAllPermissions;
// POST create permission
const createPermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Create permission request body:', req.body);
        const { name, description, moduleName, action } = req.body;
        if (!name || !moduleName || !action) {
            console.log('Missing fields:', { name, moduleName, action });
            return res.status(400).json({
                success: false,
                message: 'Name, module, and action are required'
            });
        }
        // Check if permission exists
        const existingPermission = yield prisma_1.prisma.permission.findFirst({
            where: { name }
        });
        if (existingPermission) {
            console.log('Permission already exists:', name);
            return res.status(400).json({
                success: false,
                message: 'Permission already exists'
            });
        }
        console.log('Creating permission with data:', { name, description, moduleName, action });
        // Create permission
        const permission = yield prisma_1.prisma.permission.create({
            data: {
                name,
                description,
                moduleName,
                action
            }
        });
        console.log('Permission created successfully:', permission);
        res.status(201).json({
            success: true,
            data: permission,
            message: 'Permission created successfully'
        });
    }
    catch (error) {
        // Proper error handling for TypeScript 'unknown' type
        console.error('Error creating permission DETAILS:');
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        else {
            console.error('Unknown error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Error creating permission',
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
});
exports.createPermission = createPermission;
// PUT update permission
const updatePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Update permission request body:', req.body);
        const permissionId = parseInt(req.params.id);
        const { name, description, moduleName, action } = req.body;
        console.log('Updating permission ID:', permissionId);
        // Check if permission exists
        const existingPermission = yield prisma_1.prisma.permission.findUnique({
            where: { id: permissionId }
        });
        if (!existingPermission) {
            console.log('Permission not found:', permissionId);
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }
        console.log('Updating permission with data:', { name, description, moduleName, action });
        // Update permission
        const permission = yield prisma_1.prisma.permission.update({
            where: { id: permissionId },
            data: {
                name,
                description,
                moduleName,
                action
            }
        });
        console.log('Permission updated successfully:', permission);
        res.status(200).json({
            success: true,
            data: permission,
            message: 'Permission updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating permission DETAILS:');
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }
        else {
            console.error('Unknown error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Error updating permission',
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
});
exports.updatePermission = updatePermission;
// DELETE permission
const deletePermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const permissionId = parseInt(req.params.id);
        console.log('Deleting permission ID:', permissionId);
        // Check if permission exists
        const existingPermission = yield prisma_1.prisma.permission.findUnique({
            where: { id: permissionId },
            include: {
                _count: {
                    select: {
                        roles: true
                    }
                }
            }
        });
        if (!existingPermission) {
            console.log('Permission not found:', permissionId);
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }
        // Check if permission is assigned to roles
        if (existingPermission._count.roles > 0) {
            console.log('Permission has assigned roles:', existingPermission._count.roles);
            return res.status(400).json({
                success: false,
                message: 'Cannot delete permission assigned to roles'
            });
        }
        yield prisma_1.prisma.permission.delete({
            where: { id: permissionId }
        });
        console.log('Permission deleted successfully:', permissionId);
        res.status(200).json({
            success: true,
            message: 'Permission deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting permission DETAILS:');
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }
        else {
            console.error('Unknown error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting permission',
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
});
exports.deletePermission = deletePermission;
