// controllers/roleController.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { RolePermission } from "@prisma/client"; // Import the type

// GET all roles
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          _count: {
            select: {
              userRoles: true,
              permissions: true
            }
          },
          permissions: {
            include: {
              permission: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { name: 'asc' }
      }),
      prisma.role.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: roles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles'
    });
  }
};

// GET role permissions
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Type the permissions correctly
    const permissions = role.permissions.map(rp => rp.permission);

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role permissions'
    });
  }
};

// POST update role permissions
export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds array is required'
      });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds
        }
      }
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more permissions not found'
      });
    }

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    // Create new role permissions
    if (permissionIds.length > 0) {
      const rolePermissionData = permissionIds.map((permissionId: number) => ({
        roleId,
        permissionId
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissionData
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role permissions'
    });
  }
};

// POST create role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role'
    });
  }
};

// PUT update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, description } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description
      }
    });

    res.status(200).json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role'
    });
  }
};

// DELETE role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.id);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role has users assigned
    if (existingRole._count.userRoles > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role with assigned users'
      });
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role'
    });
  }
};