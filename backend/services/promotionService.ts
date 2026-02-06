import { prisma } from "../lib/prisma";

interface PromotionConfig {
  s1ToS2: boolean;
  s3ToS4: boolean;
  s5ToS6: boolean;
  s7ToS8: boolean;
  s2ToS3: boolean;
  s4ToS5: boolean;
  s6ToS7: boolean;
  s8ToArchive: boolean;
}

interface PromotionPreview {
  s1ToS2Count: number;
  s3ToS4Count: number;
  s5ToS6Count: number;
  s7ToS8Count: number;
  s2ToS3Count: number;
  s4ToS5Count: number;
  s6ToS7Count: number;
  s8ToArchiveCount: number;
  totalToPromote: number;
}

interface PromotionDetails {
  [key: string]: number | number[];
  s1ToS2?: number;
  s3ToS4?: number;
  s5ToS6?: number;
  s7ToS8?: number;
  s2ToS3?: number;
  s4ToS5?: number;
  s6ToS7?: number;
  s8ToArchive?: number;
  s1ToS2StudentIds?: number[];
  s3ToS4StudentIds?: number[];
  s5ToS6StudentIds?: number[];
  s7ToS8StudentIds?: number[];
  s2ToS3StudentIds?: number[];
  s4ToS5StudentIds?: number[];
  s6ToS7StudentIds?: number[];
  s8StudentIds?: number[];
}

interface SemesterInfo {
  currentSemesterType: "ODD" | "EVEN";
  oddSemesters: number[];
  evenSemesters: number[];
}

export class PromotionService {
  /**
   * Get current semester type based on current date
   * You can customize this logic based on your academic calendar
   */
  static getCurrentSemesterType(): "ODD" | "EVEN" {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    // Assuming:
    // ODD semester: June-November (months 6-11)
    // EVEN semester: December-May (months 12, 1-5)
    if (month >= 6 && month <= 11) {
      return "ODD";
    }
    return "EVEN";
  }

  /**
   * Get semester information
   */
  static getSemesterInfo(): SemesterInfo {
    return {
      currentSemesterType: this.getCurrentSemesterType(),
      oddSemesters: [1, 3, 5, 7],
      evenSemesters: [2, 4, 6, 8],
    };
  }

  /**
   * Get promotion preview - count students in each semester
   */
  static async getPromotionPreview(): Promise<PromotionPreview> {
    const semesterType = this.getCurrentSemesterType();
    
    const counts = await prisma.$transaction([
      prisma.student.count({ where: { currentSemester: 1, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 2, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 3, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 4, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 5, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 6, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 7, status: { not: "graduated" } } }),
      prisma.student.count({ where: { currentSemester: 8, status: { not: "graduated" } } }),
    ]);

    const preview: PromotionPreview = {
      s1ToS2Count: semesterType === "ODD" ? counts[0] : 0,
      s3ToS4Count: semesterType === "ODD" ? counts[2] : 0,
      s5ToS6Count: semesterType === "ODD" ? counts[4] : 0,
      s7ToS8Count: semesterType === "ODD" ? counts[6] : 0,
      s2ToS3Count: semesterType === "EVEN" ? counts[1] : 0,
      s4ToS5Count: semesterType === "EVEN" ? counts[3] : 0,
      s6ToS7Count: semesterType === "EVEN" ? counts[5] : 0,
      s8ToArchiveCount: semesterType === "EVEN" ? counts[7] : 0,
      totalToPromote: 0,
    };

    if (semesterType === "ODD") {
      preview.totalToPromote = counts[0] + counts[2] + counts[4] + counts[6];
    } else {
      preview.totalToPromote = counts[1] + counts[3] + counts[5] + counts[7];
    }

    return preview;
  }

  /**
   * Execute semester promotion
   */
  static async promoteStudents(config: PromotionConfig, adminId: number) {
    const semesterType = this.getCurrentSemesterType();
    
    // Check if a promotion has already been done today to prevent duplicate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingPromotion = await prisma.promotionHistory.findFirst({
      where: {
        promotionDate: {
          gte: today,
        },
        semesterType,
      },
    });

    if (existingPromotion) {
      throw new Error("A promotion was already executed today. Use the Undo feature to revert it before promoting again.");
    }

    const promotedCounts: PromotionDetails = {};

    await prisma.$transaction(async (tx) => {
      if (semesterType === "ODD") {
        // Odd semester promotions
        if (config.s1ToS2) {
          const students = await tx.student.findMany({
            where: { currentSemester: 1, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 2 },
            });
          }
          promotedCounts.s1ToS2 = studentIds.length;
          promotedCounts.s1ToS2StudentIds = studentIds;
        }

        if (config.s3ToS4) {
          const students = await tx.student.findMany({
            where: { currentSemester: 3, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 4 },
            });
          }
          promotedCounts.s3ToS4 = studentIds.length;
          promotedCounts.s3ToS4StudentIds = studentIds;
        }

        if (config.s5ToS6) {
          const students = await tx.student.findMany({
            where: { currentSemester: 5, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 6 },
            });
          }
          promotedCounts.s5ToS6 = studentIds.length;
          promotedCounts.s5ToS6StudentIds = studentIds;
        }

        if (config.s7ToS8) {
          const students = await tx.student.findMany({
            where: { currentSemester: 7, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 8 },
            });
          }
          promotedCounts.s7ToS8 = studentIds.length;
          promotedCounts.s7ToS8StudentIds = studentIds;
        }
      } else {
        // Even semester promotions
        if (config.s2ToS3) {
          const students = await tx.student.findMany({
            where: { currentSemester: 2, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 3 },
            });
          }
          promotedCounts.s2ToS3 = studentIds.length;
          promotedCounts.s2ToS3StudentIds = studentIds;
        }

        if (config.s4ToS5) {
          const students = await tx.student.findMany({
            where: { currentSemester: 4, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 5 },
            });
          }
          promotedCounts.s4ToS5 = studentIds.length;
          promotedCounts.s4ToS5StudentIds = studentIds;
        }

        if (config.s6ToS7) {
          const students = await tx.student.findMany({
            where: { currentSemester: 6, status: { not: "graduated" } },
            select: { id: true },
          });
          const studentIds = students.map((s) => s.id);
          
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { currentSemester: 7 },
            });
          }
          promotedCounts.s6ToS7 = studentIds.length;
          promotedCounts.s6ToS7StudentIds = studentIds;
        }

        if (config.s8ToArchive) {
          // Archive S8 students
          const s8Students = await tx.student.findMany({
            where: { currentSemester: 8, status: { not: "graduated" } },
            select: {
              id: true,
              name: true,
              email: true,
              dateOfBirth: true,
              gender: true,
              student_phone_number: true,
              aadhaar_number: true,
              program: true,
              departmentId: true,
              admission_number: true,
              admission_date: true,
              passout_year: true,
              allotted_branch: true,
            },
          });

          const studentIds = s8Students.map((s) => s.id);

          // Move to graduated students table
          for (const student of s8Students) {
            await tx.graduatedStudent.create({
              data: {
                originalStudentId: student.id,
                name: student.name,
                email: student.email,
                dateOfBirth: student.dateOfBirth,
                gender: student.gender,
                student_phone_number: student.student_phone_number,
                aadhaar_number: student.aadhaar_number,
                program: student.program,
                departmentId: student.departmentId,
                admission_number: student.admission_number,
                admission_date: student.admission_date,
                passout_year: student.passout_year || new Date().getFullYear(),
                archivedBy: adminId,
                allotted_branch: student.allotted_branch,
              },
            });
          }

          // Update their status to graduated
          if (studentIds.length > 0) {
            await tx.student.updateMany({
              where: { id: { in: studentIds } },
              data: { status: "graduated" },
            });
          }
          promotedCounts.s8ToArchive = studentIds.length;
          promotedCounts.s8StudentIds = studentIds;
        }
      }

      // Log the promotion in history
      await tx.promotionHistory.create({
        data: {
          semesterType,
          adminId,
          promotionDetails: promotedCounts,
          canUndo: true,
        },
      });
    });

    return {
      success: true,
      semesterType,
      promotedCounts,
    };
  }

  /**
   * Get the last promotion history
   */
  static async getLastPromotion() {
    return await prisma.promotionHistory.findFirst({
      where: { canUndo: true },
      orderBy: { promotionDate: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Undo the last promotion
   */
  static async undoLastPromotion() {
    const lastPromotion = await this.getLastPromotion();

    if (!lastPromotion) {
      throw new Error("No undoable promotion found");
    }

    const details = lastPromotion.promotionDetails as PromotionDetails;

    await prisma.$transaction(async (tx) => {
      if (lastPromotion.semesterType === "ODD") {
        // Reverse odd semester promotions using stored student IDs
        if (details.s1ToS2StudentIds && details.s1ToS2StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s1ToS2StudentIds as number[] } },
            data: { currentSemester: 1 },
          });
        }

        if (details.s3ToS4StudentIds && details.s3ToS4StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s3ToS4StudentIds as number[] } },
            data: { currentSemester: 3 },
          });
        }

        if (details.s5ToS6StudentIds && details.s5ToS6StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s5ToS6StudentIds as number[] } },
            data: { currentSemester: 5 },
          });
        }

        if (details.s7ToS8StudentIds && details.s7ToS8StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s7ToS8StudentIds as number[] } },
            data: { currentSemester: 7 },
          });
        }
      } else {
        // Reverse even semester promotions using stored student IDs
        if (details.s2ToS3StudentIds && details.s2ToS3StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s2ToS3StudentIds as number[] } },
            data: { currentSemester: 2 },
          });
        }

        if (details.s4ToS5StudentIds && details.s4ToS5StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s4ToS5StudentIds as number[] } },
            data: { currentSemester: 4 },
          });
        }

        if (details.s6ToS7StudentIds && details.s6ToS7StudentIds.length > 0) {
          await tx.student.updateMany({
            where: { id: { in: details.s6ToS7StudentIds as number[] } },
            data: { currentSemester: 6 },
          });
        }

        if (details.s8StudentIds && details.s8StudentIds.length > 0) {
          // Restore graduated students using stored student IDs
          await tx.student.updateMany({
            where: { id: { in: details.s8StudentIds as number[] } },
            data: { status: "approved", currentSemester: 8 },
          });

          // Delete from graduated table
          await tx.graduatedStudent.deleteMany({
            where: {
              originalStudentId: { in: details.s8StudentIds as number[] },
              graduatedAt: {
                gte: new Date(lastPromotion.promotionDate),
              },
            },
          });
        }
      }

      // Mark promotion as undone
      await tx.promotionHistory.update({
        where: { id: lastPromotion.id },
        data: {
          canUndo: false,
          undoAt: new Date(),
        },
      });
    });

    return {
      success: true,
      message: "Promotion successfully undone",
    };
  }
}
