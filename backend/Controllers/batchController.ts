import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get all batches for the card registry view
 */
export const getAllBatches = async (req: Request, res: Response) => {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                batchDepartments: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                department_code: true,
                            },
                        },
                        classes: true,
                    },
                },
                admissionWindow: {
                    select: {
                        program: true,
                    },
                },
            },
            orderBy: {
                startYear: "desc",
            },
        });

        // Add computed stats for each batch
        const batchesWithStats = batches.map((batch) => ({
            ...batch,
            departmentCount: batch.batchDepartments.length,
            classCount: batch.batchDepartments.reduce(
                (acc, bd) => acc + bd.classes.length,
                0
            ),
        }));

        res.json({
            success: true,
            data: batchesWithStats,
        });
    } catch (error) {
        console.error("Error fetching batches:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch batches",
        });
    }
};

/**
 * Get a single batch by ID with full tree structure
 * Includes: BatchDepartments → Department + Classes → Advisor
 */
export const getBatchById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const batch = await prisma.batch.findUnique({
            where: { id: parseInt(id) },
            include: {
                batchDepartments: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                department_code: true,
                            },
                        },
                        classes: {
                            include: {
                                advisor: {
                                    select: {
                                        id: true,
                                        username: true,
                                        email: true,
                                    },
                                },
                                _count: {
                                    select: { students: true },
                                },
                            },
                        },
                    },
                },
                admissionWindow: {
                    select: {
                        program: true,
                    },
                },
            },
        });

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: "Batch not found",
            });
        }

        res.json({
            success: true,
            data: batch,
        });
    } catch (error) {
        console.error("Error fetching batch:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch batch details",
        });
    }
};

/**
 * Get users with FACULTY role who are not already assigned as class advisors
 */
export const getAvailableAdvisors = async (req: Request, res: Response) => {
    try {
        const advisors = await prisma.user.findMany({
            where: {
                userRoles: {
                    some: {
                        role: {
                            name: {
                                equals: "faculty",
                                mode: "insensitive",
                            },
                        },
                    },
                },
                advisedClass: null, // Must not already be an advisor
                status: "active",
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
            orderBy: {
                username: "asc",
            },
        });

        res.json({
            success: true,
            data: advisors,
        });
    } catch (error) {
        console.error("Error fetching available advisors:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch available advisors",
        });
    }
};

/**
 * Create a new class linked to a batchDepartmentId
 * Generates class name from DeptCode + Suffix (e.g., "CSA")
 */
export const createClass = async (req: Request, res: Response) => {
    try {
        const { batchDepartmentId, suffix, advisorId } = req.body;

        if (!batchDepartmentId || !suffix) {
            return res.status(400).json({
                success: false,
                error: "Batch department and suffix are required",
            });
        }

        // Get department code for constructing the class name
        const batchDepartment = await prisma.batchDepartment.findUnique({
            where: { id: parseInt(batchDepartmentId) },
            include: {
                department: {
                    select: {
                        department_code: true,
                    },
                },
            },
        });

        if (!batchDepartment) {
            return res.status(404).json({
                success: false,
                error: "Batch department not found",
            });
        }

        const className = `${batchDepartment.department.department_code}${suffix.trim().toUpperCase()}`;

        const newClass = await prisma.class.create({
            data: {
                name: className,
                batchDepartmentId: parseInt(batchDepartmentId),
                advisorId: advisorId ? parseInt(advisorId) : null,
            },
            include: {
                advisor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                batchDepartment: {
                    include: {
                        department: true,
                        batch: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: `Class ${className} created successfully`,
            data: newClass,
        });
    } catch (error: any) {
        console.error("Error creating class:", error);

        // Handle unique constraint violation (P2002)
        if (error.code === "P2002") {
            const target = error.meta?.target;
            if (target?.includes("advisor_id")) {
                return res.status(409).json({
                    success: false,
                    error: "This faculty is already assigned as an advisor to another class",
                });
            }
            if (target?.includes("batch_dept_id") || target?.includes("name")) {
                return res.status(409).json({
                    success: false,
                    error: "A class with this name already exists in this department for this batch",
                });
            }
            return res.status(409).json({
                success: false,
                error: "A unique constraint was violated",
            });
        }

        res.status(500).json({
            success: false,
            error: "Failed to create class",
        });
    }
};

/**
 * Update a class (e.g., change advisor)
 */
export const updateClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { advisorId } = req.body;

        const updatedClass = await prisma.class.update({
            where: { id: parseInt(id) },
            data: {
                advisorId: advisorId ? parseInt(advisorId) : null,
            },
            include: {
                advisor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: "Class updated successfully",
            data: updatedClass,
        });
    } catch (error: any) {
        console.error("Error updating class:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: "This faculty is already assigned as an advisor to another class",
            });
        }

        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }

        res.status(500).json({
            success: false,
            error: "Failed to update class",
        });
    }
};

/**
 * Delete a class
 */
export const deleteClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.class.delete({
            where: { id: parseInt(id) },
        });

        res.json({
            success: true,
            message: "Class deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting class:", error);

        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }

        res.status(500).json({
            success: false,
            error: "Failed to delete class",
        });
    }
};
