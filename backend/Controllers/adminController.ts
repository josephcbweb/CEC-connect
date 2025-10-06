import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const fetchStats = async (req: Request, res: Response) => {
  try {
    const totalStudents = await prisma.student.count();
    const departmentStats = await prisma.department.findMany({
      select: {
        name: true,
        students: {
          select: {
            id: true, // Just to count
          },
        },
      },
    });

    const departmentCounts = departmentStats.map((dept) => ({
      title: dept.name,
      count: dept.students.length,
    }));

    res.json( [
      { title: 'Total Students', count: totalStudents },
      ...departmentCounts,
    ]);

  } catch (error) {
    console.error("Failed to fetch student stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        program: true,
        admission_date: true,
        department: {
          select: {
            name: true,
            department_code: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const currentYear = new Date().getFullYear();

    const enriched = students.map((student) => {
      const admissionYear = student.admission_date
        ? new Date(student.admission_date).getFullYear()
        : null;

      const year =
        admissionYear && admissionYear <= currentYear
          ? currentYear - admissionYear + 1
          : null;

      return {
        id: student.id,
        name: student.name,
        program: student.program,
        department: student.department?.department_code || student.department?.name,
        year,
      };
    });

    // ✅ Extract unique programs
    const uniquePrograms = Array.from(
      new Set(students.map((s) => s.program).filter(Boolean))
    );

    res.json({
      students: enriched,
      programs: uniquePrograms,
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
    const result = await prisma.student.deleteMany({
      where: {
        id: { in: ids },
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

const calculateYear = (admissionDate: Date | null): number | null => {
  if (!admissionDate) return null;

  const now = new Date();
  const yearsElapsed = (now.getFullYear() - admissionDate.getFullYear())+1;

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
        department: student.department.name,
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
        admissionQuota: student.admission_quota,
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