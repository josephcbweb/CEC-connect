import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export const createHostel = async (req: Request, res: Response) => {
  try {
    const { name, wardenName, wardenPhone, monthlyRent } = req.body;

    const hostel = await prisma.hostel.create({
      data: { 
        name, 
        wardenName, 
        wardenPhone,
        monthlyRent: monthlyRent ? Number(monthlyRent) : 0 // Ensure it's a number
      },
    });

    return res.status(201).json({ 
      success: true, 
      message: "Hostel created with rent configuration", 
      data: hostel 
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};


export const assignStudentToHostel = async (req: Request, res: Response) => {
  try {
    const { studentId, hostelId } = req.body;

    if (!studentId || !hostelId) {
      return res.status(400).json({ success: false, message: "Student ID and Hostel ID are required." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the Student record
      // We set the current hostelId and turn on the hostel_service flag
      const student = await tx.student.update({
        where: { id: Number(studentId) },
        data: { 
          hostelId: Number(hostelId),
          hostel_service: true 
        },
      });

      // 2. Create the HostelHistory record
      // This serves as the permanent record of their "Check-in"
      const history = await tx.hostelHistory.create({
        data: {
          studentId: Number(studentId),
          hostelId: Number(hostelId),
          checkInDate: new Date(),
          status: "ACTIVE", // Mark them as currently living there
        },
      });

      return { student, history };
    });

    return res.status(200).json({ 
      success: true, 
      message: "Student successfully assigned to hostel and check-in recorded.", 
      data: result 
    });
  } catch (error: any) {
    console.error("Assignment Error:", error);
    return res.status(400).json({ 
      success: false, 
      error: "Failed to assign student. Ensure the student and hostel exist." 
    });
  }
};


export const getHostelStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hostelData = await prisma.hostel.findUnique({
      where: { id: Number(id) },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            student_phone_number: true,
            currentSemester: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!hostelData) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Flattening the class name for a cleaner API response
    const formattedStudents = hostelData.students.map(student => ({
      id: student.id,
      name: student.name,
      phone: student.student_phone_number,
      semester: student.currentSemester,
      className: student.class?.name || "Not Assigned",
    }));

    return res.status(200).json({
  success: true,
  hostelName: hostelData.name,
  warden: hostelData.wardenName,
  wardenPhone: hostelData.wardenPhone, // Add this
  monthlyRent: hostelData.monthlyRent, // Add this
  students: formattedStudents
});
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllHostels = async (req: Request, res: Response) => {
  try {
    const hostels = await prisma.hostel.findMany({
      select: {
        id: true,
        name: true,
        wardenName: true,
        wardenPhone: true,
        monthlyRent: true, // ADD THIS LINE
        _count: { select: { students: true } },
      },
    });
    return res.status(200).json({ success: true, data: hostels });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update Warden Name and Phone
export const updateWarden = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { wardenName, wardenPhone } = req.body;

    await prisma.hostel.update({
      where: { id: Number(id) },
      data: { wardenName, wardenPhone },
    });

    return res.status(200).json({ success: true, message: "Warden updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Update Monthly Rent
export const updateRent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { monthlyRent } = req.body;

    await prisma.hostel.update({
      where: { id: Number(id) },
      data: { monthlyRent: Number(monthlyRent) },
    });

    return res.status(200).json({ success: true, message: "Rent updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};