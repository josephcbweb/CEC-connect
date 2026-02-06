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
      throw new Error("A promotion has already been executed today for this semester type. Please undo it first if you want to redo.");
    }

    const promotedCounts: Record<string, number> = {};

    await prisma.$transaction(async (tx) => {
      if (semesterType === "ODD") {
        // Odd semester promotions
        if (config.s1ToS2) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 1, status: { not: "graduated" } },
            data: { currentSemester: 2 },
          });
          promotedCounts.s1ToS2 = result.count;
        }

        if (config.s3ToS4) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 3, status: { not: "graduated" } },
            data: { currentSemester: 4 },
          });
          promotedCounts.s3ToS4 = result.count;
        }

        if (config.s5ToS6) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 5, status: { not: "graduated" } },
            data: { currentSemester: 6 },
          });
          promotedCounts.s5ToS6 = result.count;
        }

        if (config.s7ToS8) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 7, status: { not: "graduated" } },
            data: { currentSemester: 8 },
          });
          promotedCounts.s7ToS8 = result.count;
        }
      } else {
        // Even semester promotions
        if (config.s2ToS3) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 2, status: { not: "graduated" } },
            data: { currentSemester: 3 },
          });
          promotedCounts.s2ToS3 = result.count;
        }

        if (config.s4ToS5) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 4, status: { not: "graduated" } },
            data: { currentSemester: 5 },
          });
          promotedCounts.s4ToS5 = result.count;
        }

        if (config.s6ToS7) {
          const result = await tx.student.updateMany({
            where: { currentSemester: 6, status: { not: "graduated" } },
            data: { currentSemester: 7 },
          });
          promotedCounts.s6ToS7 = result.count;
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

          // Update their status to graduated and keep them in student table for now
          // (or delete them if you prefer)
          const result = await tx.student.updateMany({
            where: { currentSemester: 8, status: { not: "graduated" } },
            data: { status: "graduated" },
          });
          promotedCounts.s8ToArchive = result.count;
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

    const details = lastPromotion.promotionDetails as Record<string, number>;

    await prisma.$transaction(async (tx) => {
      if (lastPromotion.semesterType === "ODD") {
        // Reverse odd semester promotions
        if (details.s1ToS2) {
          await tx.student.updateMany({
            where: { currentSemester: 2 },
            data: { currentSemester: 1 },
          });
        }

        if (details.s3ToS4) {
          await tx.student.updateMany({
            where: { currentSemester: 4 },
            data: { currentSemester: 3 },
          });
        }

        if (details.s5ToS6) {
          await tx.student.updateMany({
            where: { currentSemester: 6 },
            data: { currentSemester: 5 },
          });
        }

        if (details.s7ToS8) {
          await tx.student.updateMany({
            where: { currentSemester: 8 },
            data: { currentSemester: 7 },
          });
        }
      } else {
        // Reverse even semester promotions
        if (details.s2ToS3) {
          await tx.student.updateMany({
            where: { currentSemester: 3 },
            data: { currentSemester: 2 },
          });
        }

        if (details.s4ToS5) {
          await tx.student.updateMany({
            where: { currentSemester: 5 },
            data: { currentSemester: 4 },
          });
        }

        if (details.s6ToS7) {
          await tx.student.updateMany({
            where: { currentSemester: 7 },
            data: { currentSemester: 6 },
          });
        }

        if (details.s8ToArchive) {
          // Restore graduated students
          const graduatedStudents = await tx.graduatedStudent.findMany({
            where: {
              graduatedAt: {
                gte: new Date(lastPromotion.promotionDate),
              },
            },
          });

          for (const grad of graduatedStudents) {
            await tx.student.updateMany({
              where: { id: grad.originalStudentId },
              data: { status: "approved", currentSemester: 8 },
            });
          }

          // Delete from graduated table
          await tx.graduatedStudent.deleteMany({
            where: {
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
