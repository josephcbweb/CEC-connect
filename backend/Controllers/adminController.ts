import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const fetchStats = async (req: Request, res: Response) => {
  try {
    // We removed the 'totalStudents' query to eliminate the "All" section

    const departmentStats = await prisma.department.findMany({
      select: {
        name: true, // Assuming 'name' holds the complete department name in your DB
        students: {
          where: {
            status: {
              notIn: ["graduated", "deleted"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const departmentCounts = departmentStats.map((dept: any) => ({
      title: dept.name, // Maps the full department name directly from the database
      count: dept.students.length,
    }));

    // Return only the specific department stats
    res.json(departmentCounts);
  } catch (error) {
    console.error("Failed to fetch student stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchAllStudents = async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string;

    let whereCondition: any = {
      status: "approved",
    };

    if (statusFilter === "graduated") {
      whereCondition = { status: "graduated" };
    } else if (statusFilter === "all") {
      whereCondition = {
        status: {
          notIn: ["graduated", "deleted"],
        },
      };
    }

    const students = await prisma.student.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        program: true,
        admission_date: true,
        currentSemester: true,
        passout_year: true,
        department: {
          select: {
            name: true,
            department_code: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ currentSemester: "asc" }, { name: "asc" }],
    });

    const enriched = students.map((student: any) => {
      return {
        id: student.id,
        name: student.name,
        program: student.program,
        department:
          student.department?.department_code || student.department?.name,
        class: student.class?.name || null,
        year: student.passout_year,
        currentSemester: student.currentSemester,
      };
    });

    const uniquePrograms = Array.from(
      new Set(students.map((s: any) => s.program).filter(Boolean)),
    );

    // NEW: Fetch all available departments directly from the DB
    // This ensures we get all departments for ALL programs, not just the currently filtered students
    const allDepartments = await prisma.department.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    const uniqueDepartments = allDepartments.map((dept: any) => dept.name);

    res.json({
      students: enriched,
      programs: uniquePrograms,
      departments: uniqueDepartments, // Send the dynamic list to the frontend
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const deleteStudents = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid or empty ID list." });
  }

  try {
    // Soft delete: Set status to 'deleted'
    const result = await prisma.student.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: "deleted",
      },
    });

    return res.status(200).json({
      message: "Students deleted successfully.",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting students:", error);
    return res.status(500).json({ error: "Failed to delete students." });
  }
};

export const restoreStudents = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid or empty ID list." });
  }

  try {
    const result = await prisma.student.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: "approved", // Restore to approved
      },
    });

    return res.status(200).json({
      message: "Students restored successfully.",
      restoredCount: result.count,
    });
  } catch (error) {
    console.error("Error restoring students:", error);
    return res.status(500).json({ error: "Failed to restore students." });
  }
};

export const demoteStudents = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid or empty ID list." });
  }

  try {
    // 1. Fetch students to know their current semester
    const students = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, currentSemester: true },
    });

    const decrement1Ids: number[] = [];
    const decrement2Ids: number[] = [];

    students.forEach((s: any) => {
      // User specifications:
      // S4 -> S3 (Dec 1)
      // S6 -> S5 (Dec 1)
      // Implicit/Previous Logic:
      // S5 -> S3 (Dec 2)
      // S7 -> S5 (Dec 2)

      // Generalizing: Even -> Dec 1, Odd -> Dec 2
      if (s.currentSemester % 2 === 0) {
        decrement1Ids.push(s.id);
      } else {
        decrement2Ids.push(s.id);
      }
    });

    let count = 0;

    if (decrement1Ids.length > 0) {
      const res1 = await prisma.student.updateMany({
        where: { id: { in: decrement1Ids } },
        data: { currentSemester: { decrement: 1 } },
      });
      count += res1.count;
    }

    if (decrement2Ids.length > 0) {
      // Prevent decrementing below 1?
      // S1 -> -1? S1 shouldn't be year back usually or handled carefully.
      // Assuming inputs are >= 3 for odd sems based on previous logic.
      const res2 = await prisma.student.updateMany({
        where: { id: { in: decrement2Ids } },
        data: { currentSemester: { decrement: 2 } },
      });
      count += res2.count;
    }

    return res.status(200).json({
      message: `Processed Year Back for ${count} students.`,
      count: count,
    });
  } catch (error) {
    console.error("Error demoting students:", error);
    return res.status(500).json({ error: "Failed to demote students." });
  }
};

const calculateYear = (admissionDate: Date | null): number | null => {
  if (!admissionDate) return null;

  const now = new Date();
  const yearsElapsed = now.getFullYear() - admissionDate.getFullYear() + 1;

  // Adjust if current month is before admission month
  const hasCompletedYear =
    now.getMonth() >= admissionDate.getMonth() &&
    now.getDate() >= admissionDate.getDate();

  return hasCompletedYear ? yearsElapsed + 1 : yearsElapsed;
};

export const getStudentDetails = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id);

  if (isNaN(studentId)) {
    return res.status(400).json({ error: "Invalid student ID" });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true, // to get department name
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const response = {
      personalDetails: {
        name: student.name,
        email: student.email,
        dateOfBirth: student.dateOfBirth,
        program: student.program,
        department: student.department?.name || "Not Assigned",
        year: calculateYear(student.admission_date),
        gender: student.gender,
        bloodGroup: student.blood_group,
        phone: student.student_phone_number,
        permanentAddress: student.permanent_address,
        contactAddress: student.contact_address,
        aadhaarNumber: student.aadhaar_number,
        fatherName: student.fatherName,
        fatherPhone: student.father_phone_number,
        motherName: student.motherName,
        motherPhone: student.mother_phone_number,
        parentEmail: student.parent_email,
        guardianName: student.guardian_name,
        guardianAddress: student.local_guardian_address,
        guardianPhone: student.local_guardian_phone_number,
        admittedCategory: student.admitted_category,
      },
      academicDetails: {
        physics: student.physics_score,
        chemistry: student.chemistry_score,
        maths: student.maths_score,
        keamTotal: student.keam_subject_total,
        entranceTotal: student.entrance_total_score,
        previousPercentage: student.previous_degree_cgpa_or_total_marks,
        previousInstitution: student.last_institution,
      },
      bankDetails: {
        accountNumber: student.account_number,
        bankName: student.bank_name,
        bankBranch: student.bank_branch,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching student details:", error);
    return res.status(500).json({ error: "Failed to fetch student details" });
  }
};
