import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ─── GET /api/analytics ──────────────────────────────────────────────────────
// Returns a comprehensive analytics payload covering every platform domain.
export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    // ── 1. Students ──────────────────────────────────────────────────────────
    const [
      totalStudents,
      studentsByStatus,
      studentsByProgram,
      studentsByGender,
      studentsBySemester,
      studentsByAdmissionType,
      studentsByCategory,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.student.groupBy({ by: ["program"], _count: { id: true } }),
      prisma.student.groupBy({ by: ["gender"], _count: { id: true } }),
      prisma.student.groupBy({
        by: ["currentSemester"],
        _count: { id: true },
        where: { status: { notIn: ["graduated", "deleted"] } },
        orderBy: { currentSemester: "asc" },
      }),
      prisma.student.groupBy({ by: ["admission_type"], _count: { id: true } }),
      prisma.student.groupBy({ by: ["category"], _count: { id: true } }),
    ]);

    // Recent admissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdmissions = await prisma.student.count({
      where: { admission_date: { gte: thirtyDaysAgo } },
    });

    // ── 2. Departments ───────────────────────────────────────────────────────
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { students: true, courses: true } },
      },
    });

    const departmentStats = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.department_code,
      program: d.program,
      status: d.status,
      studentCount: d._count.students,
      courseCount: d._count.courses,
    }));

    // ── 3. Fees & Revenue ────────────────────────────────────────────────────
    const invoices = await prisma.invoice.findMany({
      select: {
        amount: true,
        baseAmount: true,
        fineAmount: true,
        status: true,
        semester: true,
        issueDate: true,
      },
    });

    const totalInvoiced = invoices.reduce(
      (s, i) => s + parseFloat(i.amount as any),
      0,
    );
    const totalCollected = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + parseFloat(i.amount as any), 0);
    const totalPending = invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce((s, i) => s + parseFloat(i.amount as any), 0);
    const totalOverdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + parseFloat(i.amount as any), 0);
    const totalFine = invoices.reduce(
      (s, i) => s + parseFloat((i.fineAmount as any) || "0"),
      0,
    );

    const invoicesByStatus = invoices.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Monthly collection trend (last 12 months)
    const monthlyRevenue: Record<
      string,
      { month: string; collected: number; pending: number; count: number }
    > = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyRevenue[key])
        monthlyRevenue[key] = {
          month: key,
          collected: 0,
          pending: 0,
          count: 0,
        };
      monthlyRevenue[key].count++;
      if (inv.status === "paid")
        monthlyRevenue[key].collected += parseFloat(inv.amount as any);
      else monthlyRevenue[key].pending += parseFloat(inv.amount as any);
    });
    const monthlyRevenueTrend = Object.values(monthlyRevenue).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    // Payments
    const payments = await prisma.payment.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    const paymentsByMethod = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      _count: { id: true },
      _sum: { amount: true },
    });

    // ── 4. Bus ───────────────────────────────────────────────────────────────
    const buses = await prisma.bus.findMany({
      include: {
        _count: { select: { students: true, stops: true } },
      },
    });

    const busStats = {
      totalBuses: buses.length,
      activeBuses: buses.filter((b) => b.isActive).length,
      totalSeats: buses.reduce((s, b) => s + b.totalSeats, 0),
      totalOccupied: buses.reduce((s, b) => s + b._count.students, 0),
      utilization: buses.map((b) => ({
        id: b.id,
        name: b.busName || b.busNumber,
        route: b.routeName,
        totalSeats: b.totalSeats,
        occupied: b._count.students,
        stops: b._count.stops,
        occupancyRate:
          b.totalSeats > 0
            ? Math.round((b._count.students / b.totalSeats) * 100)
            : 0,
      })),
    };

    const busRequestsByStatus = await prisma.busRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // ── 5. Hostel ────────────────────────────────────────────────────────────
    const hostels = await prisma.hostel.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    const hostelStats = {
      totalHostels: hostels.length,
      totalOccupants: hostels.reduce((s, h) => s + h._count.students, 0),
      hostels: hostels.map((h) => ({
        id: h.id,
        name: h.name,
        warden: h.wardenName,
        monthlyRent: h.monthlyRent,
        occupants: h._count.students,
      })),
    };

    // ── 6. Certificates ──────────────────────────────────────────────────────
    const [certByType, certByStatus, certByWorkflow] = await Promise.all([
      prisma.certificate.groupBy({ by: ["type"], _count: { id: true } }),
      prisma.certificate.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.certificate.groupBy({
        by: ["workflowStatus"],
        _count: { id: true },
      }),
    ]);
    const totalCertificates = await prisma.certificate.count();

    // ── 7. Due Management / No-Due ───────────────────────────────────────────
    const [noDueReqByStatus, noDueByStatus, totalNoDueRequests, totalNoDues] =
      await Promise.all([
        prisma.noDueRequest.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.noDue.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.noDueRequest.count(),
        prisma.noDue.count(),
      ]);

    // Service department clearance rates
    const serviceDepts = await prisma.serviceDepartment.findMany({
      include: {
        noDues: { select: { status: true } },
      },
    });
    const serviceDeptClearance = serviceDepts.map((sd) => {
      const total = sd.noDues.length;
      const cleared = sd.noDues.filter((n) => n.status === "cleared").length;
      return {
        id: sd.id,
        name: sd.name,
        total,
        cleared,
        pending: total - cleared,
        clearanceRate: total > 0 ? Math.round((cleared / total) * 100) : 0,
      };
    });

    // ── 8. Courses ───────────────────────────────────────────────────────────
    const [totalCourses, coursesByType, coursesByCategory, activeCourses] =
      await Promise.all([
        prisma.course.count(),
        prisma.course.groupBy({ by: ["type"], _count: { id: true } }),
        prisma.course.groupBy({ by: ["category"], _count: { id: true } }),
        prisma.course.count({ where: { isActive: true } }),
      ]);

    // ── 9. Staff ─────────────────────────────────────────────────────────────
    const totalStaff = await prisma.user.count();
    const staffByStatus = await prisma.user.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Role distribution
    const roles = await prisma.role.findMany({
      include: { _count: { select: { userRoles: true } } },
    });
    const staffByRole = roles.map((r) => ({
      role: r.name,
      count: r._count.userRoles,
    }));

    // ── 10. Notifications ────────────────────────────────────────────────────
    const [totalNotifications, notifByPriority, notifByTarget] =
      await Promise.all([
        prisma.notification.count(),
        prisma.notification.groupBy({
          by: ["priority"],
          _count: { id: true },
        }),
        prisma.notification.groupBy({
          by: ["targetType"],
          _count: { id: true },
        }),
      ]);

    // ── 11. Batches ──────────────────────────────────────────────────────────
    const batchesByStatus = await prisma.batch.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const totalBatches = await prisma.batch.count();

    // ── 12. Admissions (windows) ─────────────────────────────────────────────
    const admissionWindows = await prisma.admissionWindow.findMany({
      include: {
        batch: { select: { name: true } },
      },
      orderBy: { startDate: "desc" },
      take: 10,
    });

    // ── 13. Audit Logs (recent activity count) ───────────────────────────────
    const totalAuditLogs = await prisma.auditLog.count();
    const recentAuditLogs = await prisma.auditLog.count({
      where: { timestamp: { gte: thirtyDaysAgo } },
    });

    // ── 14. Email Queue ──────────────────────────────────────────────────────
    const emailsByStatus = await prisma.emailQueue.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // ── Assemble response ────────────────────────────────────────────────────
    res.json({
      students: {
        total: totalStudents,
        recentAdmissions,
        byStatus: studentsByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byProgram: studentsByProgram.map((s) => ({
          program: s.program,
          count: s._count.id,
        })),
        byGender: studentsByGender.map((s) => ({
          gender: s.gender,
          count: s._count.id,
        })),
        bySemester: studentsBySemester.map((s) => ({
          semester: s.currentSemester,
          count: s._count.id,
        })),
        byAdmissionType: studentsByAdmissionType.map((s) => ({
          type: s.admission_type,
          count: s._count.id,
        })),
        byCategory: studentsByCategory.map((s) => ({
          category: s.category,
          count: s._count.id,
        })),
      },
      departments: departmentStats,
      fees: {
        totalInvoiced: Math.round(totalInvoiced),
        totalCollected: Math.round(totalCollected),
        totalPending: Math.round(totalPending),
        totalOverdue: Math.round(totalOverdue),
        totalFine: Math.round(totalFine),
        collectionRate:
          totalInvoiced > 0
            ? Math.round((totalCollected / totalInvoiced) * 100)
            : 0,
        invoicesByStatus,
        monthlyRevenueTrend,
        payments: payments.map((p) => ({
          status: p.status,
          count: p._count.id,
          total: Math.round(parseFloat((p._sum.amount as any) || "0")),
        })),
        paymentsByMethod: paymentsByMethod.map((p) => ({
          method: p.paymentMethod,
          count: p._count.id,
          total: Math.round(parseFloat((p._sum.amount as any) || "0")),
        })),
      },
      bus: {
        ...busStats,
        requestsByStatus: busRequestsByStatus.map((r) => ({
          status: r.status,
          count: r._count.id,
        })),
      },
      hostel: hostelStats,
      certificates: {
        total: totalCertificates,
        byType: certByType.map((c) => ({ type: c.type, count: c._count.id })),
        byStatus: certByStatus.map((c) => ({
          status: c.status,
          count: c._count.id,
        })),
        byWorkflow: certByWorkflow.map((c) => ({
          stage: c.workflowStatus,
          count: c._count.id,
        })),
      },
      dues: {
        totalRequests: totalNoDueRequests,
        totalDues: totalNoDues,
        requestsByStatus: noDueReqByStatus.map((r) => ({
          status: r.status,
          count: r._count.id,
        })),
        duesByStatus: noDueByStatus.map((d) => ({
          status: d.status,
          count: d._count.id,
        })),
        serviceDeptClearance,
      },
      courses: {
        total: totalCourses,
        active: activeCourses,
        inactive: totalCourses - activeCourses,
        byType: coursesByType.map((c) => ({
          type: c.type,
          count: c._count.id,
        })),
        byCategory: coursesByCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
      staff: {
        total: totalStaff,
        byStatus: staffByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byRole: staffByRole,
      },
      notifications: {
        total: totalNotifications,
        byPriority: notifByPriority.map((n) => ({
          priority: n.priority,
          count: n._count.id,
        })),
        byTarget: notifByTarget.map((n) => ({
          target: n.targetType,
          count: n._count.id,
        })),
      },
      batches: {
        total: totalBatches,
        byStatus: batchesByStatus.map((b) => ({
          status: b.status,
          count: b._count.id,
        })),
      },
      admissionWindows: admissionWindows.map((w) => ({
        id: w.id,
        program: w.program,
        isOpen: w.isOpen,
        startDate: w.startDate,
        endDate: w.endDate,
        batch: w.batch?.name || "N/A",
      })),
      auditLogs: {
        total: totalAuditLogs,
        last30Days: recentAuditLogs,
      },
      emails: {
        byStatus: emailsByStatus.map((e) => ({
          status: e.status,
          count: e._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch analytics", error: error.message });
  }
};
