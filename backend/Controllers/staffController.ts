// controllers/staffController.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

// GET all users (staff)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10", search = "", status = "" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
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
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

// POST create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, roleIds, status = "active" } = req.body;

    if (!username || !email || !password || !roleIds) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and roleIds are required",
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
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
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        status,
        userRoles: {
          create: roleIds.map((roleId: number) => ({
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
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

// PUT update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, password, roleIds, status } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData: any = {
      username,
      email,
      status,
    };

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Update user
    const user = await prisma.user.update({
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
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      // Create new roles
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: number) => ({
            userId,
            roleId,
          })),
        });
      }

      // Fetch updated user with roles
      const updatedUser = await prisma.user.findUnique({
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
      const { passwordHash: _, ...userWithoutPassword } = updatedUser!;

      return res.status(200).json({
        success: true,
        data: userWithoutPassword,
        message: "User updated successfully",
      });
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

// DELETE user (soft delete - set to inactive)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - set status to inactive
    await prisma.user.update({
      where: { id: userId },
      data: { status: "inactive" },
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};