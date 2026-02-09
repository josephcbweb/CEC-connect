import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export const createHostel = async (req: Request, res: Response) => {
  try {
    const { name, wardenName, wardenPhone } = req.body;

    const hostel = await prisma.hostel.create({
      data: { name, wardenName, wardenPhone },
    });

    return res.status(201).json({ success: true, data: hostel });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};


export const assignStudentToHostel = async (req: Request, res: Response) => {
  try {
    const { studentId, hostelId } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id: Number(studentId) },
      data: { hostelId: Number(hostelId) },
    });

    return res.status(200).json({ success: true, message: "Student assigned to hostel", data: updatedStudent });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: "Failed to assign student. Ensure ID is correct." });
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
        _count: { select: { students: true } },
      },
    });
    return res.status(200).json({ success: true, data: hostels });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};