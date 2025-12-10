import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getStudents = async (req: Request, res: Response) => {
  const result = await prisma.student.findMany({
    include: {
      department: true,
      invoices: { include: { FeeStructure: true } },
      feeDetails: true,
    },
  });
  res.status(201).json(result);
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


export const getStudentFeeDetails = async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID provided." });
    }

    const studentWithFees = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        invoices: {
          orderBy: {
            dueDate: "asc",
          },
          include: {
            fee: true,
            FeeStructure: true,
          },
        },
      },
    });

    if (!studentWithFees) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.status(200).json(studentWithFees);
  } catch (error) {
    console.error(
      `Error fetching fee details for student ID ${req.params.id}:`,
      error
    );
    res.status(500).json({ error: "Failed to retrieve fee details." });
  }
};

export const getStudentProfile = async (req:Request,res:Response) => {
  
  const studentId = parseInt(req.params.id);
  if(isNaN(studentId)){
    return res.status(400).json({error:"Invalid student ID"});
  }
  try{
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include:{
        department:true,//to get department name
      },
    });
    if(!student){
      return res.status(404).json({ error: "Student not found" });
    }
    console.log(student);
    const formattedStudent = {
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

      physics: student.physics_score,
      chemistry: student.chemistry_score,
      maths: student.maths_score,
      keamTotal: student.keam_subject_total,
      entranceTotal: student.entrance_total_score,
      previousPercentage: student.previous_degree_cgpa_or_total_marks,
      previousInstitution: student.last_institution,

      accountNumber: student.account_number,
      bankName: student.bank_name,
      bankBranch: student.bank_branch,
    };
    console.log(formattedStudent);
    return res.status(200).json(formattedStudent);
  }catch(error) {
    console.log(`Error fetching student details:`,error);
    return res.status(500).json({error:`Failed to fetch student details`});
  }
}
