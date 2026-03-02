import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { CheckCircle, Clock, Download, Loader2, FileText } from "lucide-react";
import { motion } from "motion/react";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SemesterRegister = () => {
  usePageTitle("Semester Registration");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "cleared" | "pending"
  >("all");
  const [filterCategory, setFilterCategory] = useState<
    "all" | "academic" | "service"
  >("all");

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const token =
        localStorage.getItem("studentAuthToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        setCheckingStatus(false);
        return;
      }

      const decoded: any = jwtDecode(token);
      const studentId = decoded.userId || decoded.id;

      const response = await fetch(
        `http://localhost:3000/api/nodue/status?studentId=${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Also check if registration is enabled globally
      const settingsResponse = await fetch("http://localhost:3000/settings");
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        const noDueSetting = settingsData.find(
          (s: any) => s.key === "noDueRequestEnabled",
        );
        if (noDueSetting && !noDueSetting.enabled) {
          // If registration is closed, redirect to dashboard
          window.location.href = "/student";
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (data.status === "active") {
          setExistingRequest(data.request);
        }
      }
    } catch (err) {
      console.error("Failed to check status", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const generatePDF = () => {
    if (!existingRequest || !existingRequest.student) return;

    const doc = new jsPDF();
    const student = existingRequest.student;

    doc.setTextColor(240, 240, 240);
    doc.setFontSize(30);
    const watermarkText = `${student.name} • ${student.admission_number || existingRequest.id}   `;
    for (let i = -1; i < 5; i++) {
      for (let j = -1; j < 8; j++) {
        doc.text(watermarkText, i * 80, j * 50, { angle: 35 });
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Dark blue
    doc.text("College Of Engineering, Cherthala", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100); // Grey
    doc.text("No Due Status Form", 105, 30, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);

    // Student Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const startY = 48;
    const lineHeight = 8;

    doc.text(`Name: ${student.name}`, 20, startY);
    doc.text(
      `Admission Number: ${student.admission_number || "N/A"}`,
      20,
      startY + lineHeight,
    );
    doc.text(`Request ID: #${existingRequest.id}`, 20, startY + lineHeight * 2);
    doc.text(
      `Semester: ${existingRequest.targetSemester}`,
      20,
      startY + lineHeight * 3,
    );
    doc.text(`Email: ${student.email || "N/A"}`, 20, startY + lineHeight * 4);

    // Due Details Table
    const tableColumn = ["Clearance Entity", "Details", "Status"];
    const tableRows: any[] = [];

    // 1. Add Academic Dues (Courses)
    if (existingRequest.noDues) {
      existingRequest.noDues
        .filter((due: any) => due.course)
        .forEach((due: any) => {
          const course = due.course;
          const typeLabel = course.type === "LAB" ? "Lab" : "Theory";
          let categoryLabel = "";
          if (course.category === "ELECTIVE") categoryLabel = " • Elective";
          else if (course.category === "HONOURS") categoryLabel = " • Honours";

          tableRows.push([
            course.name,
            `${typeLabel}${categoryLabel}\nFaculty: ${course.staff?.name || "Unassigned"}`,
            due.status.toUpperCase(),
          ]);
        });
    }

    // 2. Add Service Dues
    existingRequest.noDues
      .filter((due: any) => due.serviceDepartment)
      .forEach((due: any) => {
        tableRows.push([
          due.serviceDepartment.name,
          "Service Dept",
          due.status.toUpperCase(),
        ]);
      });

    // 3. Fallback: Academic Dues without courses
    existingRequest.noDues
      .filter(
        (due: any) => due.department && !due.serviceDepartment && !due.course,
      )
      .forEach((due: any) => {
        tableRows.push([
          due.department.name,
          "Department Clearance",
          due.status.toUpperCase(),
        ]);
      });

    autoTable(doc, {
      startY: 95,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60 },
        2: { cellWidth: "auto", halign: "right" },
      },
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY || 120;

    doc.setFontSize(11);
    doc.text("Signature of Student:", 20, finalY + 40);
    doc.line(55, finalY + 40, 100, finalY + 40);

    doc.text("Date:", 140, finalY + 40);
    doc.line(150, finalY + 40, 190, finalY + 40);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by CEC Connect System", 105, 280, { align: "center" });

    doc.save("No_Due_Status_Form.pdf");
  };

  if (checkingStatus) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-sm m-4 lg:m-8">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-[20px] opacity-20"></div>
          <Loader2 className="w-12 h-12 text-blue-600 relative z-10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Preparing Your Profile
          </h3>
          <p className="text-slate-500 max-w-sm">
            Please wait while we check your no due clearance status...
          </p>
        </motion.div>
      </div>
    );
  }

  // Removed the early return for existingRequest to allow adding more courses
  // if (existingRequest) { ... }

  const displayRows: any[] = [];
  if (existingRequest) {
    if (existingRequest.noDues) {
      existingRequest.noDues
        .filter((due: any) => due.course)
        .forEach((due: any) => {
          const course = due.course;
          const status = due.status;

          // Filter logic
          const matchesStatus =
            filterStatus === "all" || status === filterStatus;
          const matchesCategory =
            filterCategory === "all" || filterCategory === "academic";

          if (matchesStatus && matchesCategory) {
            let typeLabel = "Theory";
            if (course.type === "LAB") typeLabel = "Lab";

            let categoryLabel = "";
            if (course.category === "ELECTIVE") categoryLabel = " • Elective";
            else if (course.category === "HONOURS")
              categoryLabel = " • Honours";

            const facultyName = course.staff?.name || "Unassigned";

            displayRows.push({
              id: `course-${course.id}`,
              name: course.name,
              type: "Academic",
              status: status,
              details: `${typeLabel}${categoryLabel}`,
              faculty: facultyName,
              semester: existingRequest.targetSemester,
            });
          }
        });
    }
    // 2. Service Dues
    existingRequest.noDues
      .filter((due: any) => due.serviceDepartment)
      .forEach((due: any) => {
        const status = due.status;
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        const matchesCategory =
          filterCategory === "all" || filterCategory === "service";

        if (matchesStatus && matchesCategory) {
          displayRows.push({
            id: `due-${due.id}`,
            name: due.serviceDepartment.name,
            type: "Service",
            status: status,
            details: "Service Dept",
            semester: existingRequest.targetSemester,
          });
        }
      });

    // 3. Fallback for Academic Dues without courses
    existingRequest.noDues
      .filter(
        (due: any) => due.department && !due.serviceDepartment && !due.course,
      )
      .forEach((due: any) => {
        const status = due.status;
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        const matchesCategory =
          filterCategory === "all" || filterCategory === "academic";

        if (matchesStatus && matchesCategory) {
          displayRows.push({
            id: `due-${due.id}`,
            name: due.department.name,
            type: "Academic",
            status: status,
            details: "Department Clearance",
            semester: existingRequest.targetSemester,
          });
        }
      });
  }

  return (
    <div className="relative min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-6xl mx-auto relative z-10"
      >
        {existingRequest ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                No Due Status
              </h1>
              <p className="text-slate-500">
                View your current no due clearance status.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="text-blue-600" size={20} />
                    Current Request Status
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Request ID: #{existingRequest.id} • Date:{" "}
                    {(() => {
                      const d = new Date(existingRequest.requestDate);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      return `${day}-${month}-${year}`;
                    })()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      existingRequest.status === "cleared"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {existingRequest.status}
                  </span>
                  <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
                  >
                    <Download size={16} /> Export PDF
                  </button>
                </div>
              </div>

              <div className="mb-6 rounded-md bg-amber-50 p-4 border border-amber-200 text-amber-800 text-sm animate-in fade-in duration-300">
                <div className="flex gap-3 mb-2 font-medium">
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <p>Important: Download PDF Report</p>
                </div>
                <p className="ml-8 text-amber-700">
                  Please download your No Due format report using the Export PDF
                  button above and keep it with you. You may be required to
                  submit this document at the office.
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-slate-700">
                    Clearance Details
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="academic">Academic</option>
                      <option value="service">Service</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">Clearance Entity</th>
                        <th className="px-4 py-3">Details</th>
                        <th className="px-4 py-3">Semester</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayRows.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <div className="flex flex-col">
                              <span>{row.name}</span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                {row.type === "Academic" ? (
                                  <span className="text-blue-600/80">
                                    Academic Due
                                  </span>
                                ) : (
                                  <span className="text-purple-600/80">
                                    Service Due
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700">
                                {row.details}
                              </span>
                              {row.faculty && (
                                <span className="text-xs text-slate-500 mt-0.5">
                                  Faculty: {row.faculty}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                              S{row.semester}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {row.status === "cleared" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                                <CheckCircle size={12} /> Cleared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {displayRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-4 text-center text-slate-500"
                          >
                            No dues found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto mt-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No Registration Data Found
            </h2>
            <p className="text-slate-500 mb-8">
              No registration information is available for you at this time.
              This usually happens when the registration period hasn't started
              or your record hasn't been initialized by the office.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm">
              <p className="font-medium mb-1">Think this is a mistake?</p>
              <p>
                Please contact the college office to verify your registration
                status.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SemesterRegister;
