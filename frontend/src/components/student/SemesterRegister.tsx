import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Course {
  id: number;
  name: string;
  code: string;
  type: "LAB" | "THEORY";
  category: "CORE" | "ELECTIVE" | "HONOURS";
  semester: number;
  department: {
    name: string;
  };
}

const SemesterRegister = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [targetSemester, setTargetSemester] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hostelService, setHostelService] = useState(false);

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

  useEffect(() => {
    if (existingRequest) {
      // If request exists, pre-select courses
      if (existingRequest.courseSelections) {
        setSelectedCourses(
          existingRequest.courseSelections.map((cs: any) => cs.courseId)
        );
      }
      // Also fetch courses for the target semester of the existing request
      fetchCourses(existingRequest.targetSemester);
      setTargetSemester(existingRequest.targetSemester);
    } else if (targetSemester) {
      fetchCourses(targetSemester);
    }
  }, [targetSemester, existingRequest]);

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
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "active") {
          setExistingRequest(data.request);
        } else if (data.currentSemester) {
          setTargetSemester(data.currentSemester);
        }
      }
    } catch (err) {
      console.error("Failed to check status", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchCourses = async (semester: number) => {
    try {
      const token =
        localStorage.getItem("studentAuthToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/courses/student?semester=${semester}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const handleToggleCourse = (courseId: number) => {
    // Prevent unselecting if already registered
    if (
      existingRequest?.courseSelections?.some(
        (cs: any) => cs.courseId === courseId
      )
    ) {
      return;
    }

    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const generatePDF = () => {
    if (!existingRequest || !existingRequest.student) return;

    const doc = new jsPDF();
    const student = existingRequest.student;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Dark blue
    doc.text("College Of Engineering, Cherthala", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100); // Grey
    doc.text("Semester Registration Form", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text("Academic Year: 2025 - 2026", 105, 38, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    // Student Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const startY = 55;
    const lineHeight = 8;

    doc.text(`Name: ${student.name}`, 20, startY);
    doc.text(
      `Admission Number: ${student.admission_number || "N/A"}`,
      20,
      startY + lineHeight
    );
    doc.text(`Student ID: ${student.id}`, 20, startY + lineHeight * 2);
    doc.text(
      `Semester: ${existingRequest.targetSemester}`,
      20,
      startY + lineHeight * 3
    );
    doc.text(`Email: ${student.email || "N/A"}`, 20, startY + lineHeight * 4);

    // Due Details Table
    const tableColumn = ["Subject / Department", "Type", "Status"];
    const tableRows: any[] = [];

    // 1. Add Academic Dues (Course Selections)
    if (existingRequest.courseSelections) {
      existingRequest.courseSelections.forEach((cs: any) => {
        const course = cs.course;
        if (!course) return;

        // Find status for this department
        const deptDue = existingRequest.noDues.find(
          (d: any) => d.departmentId === course.departmentId
        );
        const status = deptDue ? deptDue.status : "pending";

        let suffix = "";
        if (course.type === "LAB") suffix = " (Lab)";
        else if (course.category === "ELECTIVE") suffix = " (Elective)";
        else if (course.category === "HONOURS") suffix = " (Honours)";

        tableRows.push([
          `${course.name}${suffix}`,
          "Academic",
          status.toUpperCase(),
        ]);
      });
    }

    // 2. Add Service Dues (Library, Hostel, etc.)
    existingRequest.noDues
      .filter((due: any) => due.serviceDepartment)
      .forEach((due: any) => {
        tableRows.push([
          due.serviceDepartment.name,
          "Service",
          due.status.toUpperCase(),
        ]);
      });

    // 3. Fallback: If no courses but academic dues exist (legacy/error case)
    existingRequest.noDues
      .filter((due: any) => due.department && !due.serviceDepartment)
      .forEach((due: any) => {
        // Check if this department was already covered by a course selection
        const covered = existingRequest.courseSelections?.some(
          (cs: any) => cs.course?.departmentId === due.departmentId
        );
        if (!covered) {
          tableRows.push([
            due.department.name,
            "Academic",
            due.status.toUpperCase(),
          ]);
        }
      });

    autoTable(doc, {
      startY: 105,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
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

    doc.save("Semester_Registration_Form.pdf");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token =
        localStorage.getItem("studentAuthToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      const decoded: any = jwtDecode(token);
      const studentId = decoded.userId || decoded.id;

      const response = await fetch("http://localhost:3000/api/nodue/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          courseIds: selectedCourses,
          targetSemester,
          hostelService,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        checkStatus(); // Refresh status
      } else {
        const data = await response.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="p-8 text-center text-slate-500">Loading status...</div>
    );
  }

  // Removed the early return for existingRequest to allow adding more courses
  // if (existingRequest) { ... }

  if (success) {
    // Fallback if checkStatus hasn't updated yet or for immediate feedback
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Registration Successful
        </h2>
        <p className="text-slate-600 max-w-md">
          Your semester registration has been submitted. A "No Due" clearance
          request has been initiated with the relevant departments.
        </p>
        <button
          onClick={() => (window.location.href = "/student")}
          className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Go to Dashboard
        </button>
      </motion.div>
    );
  }

  const labs = courses.filter((c) => c.type === "LAB");
  const coreSubjects = courses.filter(
    (c) => c.type === "THEORY" && c.category === "CORE"
  );
  const electives = courses.filter(
    (c) => c.category === "ELECTIVE" || c.category === "HONOURS"
  );

  // Prepare rows for the status table
  const displayRows: any[] = [];
  if (existingRequest) {
    // 1. Academic Dues (Course Selections)
    if (existingRequest.courseSelections) {
      existingRequest.courseSelections.forEach((cs: any) => {
        const course = cs.course;
        if (!course) return;
        const deptDue = existingRequest.noDues.find(
          (d: any) => d.departmentId === course.departmentId
        );
        const status = deptDue ? deptDue.status : "pending";

        // Filter logic
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        const matchesCategory =
          filterCategory === "all" || filterCategory === "academic";

        if (matchesStatus && matchesCategory) {
          let suffix = "";
          if (course.type === "LAB") suffix = " (Lab)";
          else if (course.category === "ELECTIVE") suffix = " (Elective)";
          else if (course.category === "HONOURS") suffix = " (Honours)";

          displayRows.push({
            id: `course-${course.id}`,
            name: `${course.name}${suffix}`,
            type: "Academic",
            status: status,
            details: course.department?.name,
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
          });
        }
      });

    // 3. Fallback for Academic Dues without courses
    existingRequest.noDues
      .filter((due: any) => due.department && !due.serviceDepartment)
      .forEach((due: any) => {
        const covered = existingRequest.courseSelections?.some(
          (cs: any) => cs.course?.departmentId === due.departmentId
        );
        if (!covered) {
          const status = due.status;
          const matchesStatus =
            filterStatus === "all" || status === filterStatus;
          const matchesCategory =
            filterCategory === "all" || filterCategory === "academic";

          if (matchesStatus && matchesCategory) {
            displayRows.push({
              id: `due-${due.id}`,
              name: due.department.name,
              type: "Academic",
              status: status,
              details: "Department Clearance",
            });
          }
        }
      });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {existingRequest
            ? "Update Semester Registration"
            : "Semester Registration"}
        </h1>
        <p className="text-slate-500">
          {existingRequest
            ? "View your current status and add additional courses if needed."
            : "Select your courses for the upcoming semester. Selecting a course will automatically initiate a No Due request from the respective department."}
        </p>
      </div>

      {existingRequest && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                Current Request Status
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Request ID: #{existingRequest.id} • Date:{" "}
                {new Date(existingRequest.requestDate).toLocaleDateString()}
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
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayRows.map((row: any) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        <div>{row.name}</div>
                        {row.details && (
                          <div className="text-xs text-slate-500 mt-0.5 font-normal">
                            {row.details}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {row.type === "Academic" ? (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                            Academic
                          </span>
                        ) : (
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                            Service
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
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
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
          Registering for Semester {targetSemester}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Labs Column */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
            Select Labs
          </h3>
          <div className="space-y-3 flex-1">
            {labs.map((course, index) => {
              const isRegistered = existingRequest?.courseSelections?.some(
                (cs: any) => cs.courseId === course.id
              );
              return (
                <motion.label
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={course.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isRegistered
                      ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-75"
                      : selectedCourses.includes(course.id)
                      ? "border-purple-500 bg-purple-50 cursor-pointer"
                      : "border-slate-200 hover:border-purple-200 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                    disabled={isRegistered}
                  />
                  <div>
                    <div className="font-medium text-slate-900">
                      {course.name}
                      {isRegistered && (
                        <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Registered
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span>{course.code}</span>
                      <span>•</span>
                      <span>{course.department.name}</span>
                    </div>
                  </div>
                </motion.label>
              );
            })}
            {labs.length === 0 && (
              <p className="text-slate-400 italic text-sm">
                No labs available for this semester.
              </p>
            )}
          </div>
        </div>

        {/* Core Subjects Column */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Core Subjects
          </h3>
          <div className="space-y-3 flex-1">
            {coreSubjects.map((course, index) => {
              const isRegistered = existingRequest?.courseSelections?.some(
                (cs: any) => cs.courseId === course.id
              );
              return (
                <motion.label
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={course.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isRegistered
                      ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-75"
                      : selectedCourses.includes(course.id)
                      ? "border-blue-500 bg-blue-50 cursor-pointer"
                      : "border-slate-200 hover:border-blue-200 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                    disabled={isRegistered}
                  />
                  <div>
                    <div className="font-medium text-slate-900">
                      {course.name}
                      {isRegistered && (
                        <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Registered
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span>{course.code}</span>
                      <span>•</span>
                      <span>{course.department.name}</span>
                    </div>
                  </div>
                </motion.label>
              );
            })}
            {coreSubjects.length === 0 && (
              <p className="text-slate-400 italic text-sm">
                No core subjects available.
              </p>
            )}
          </div>
        </div>

        {/* Electives Column */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
            Electives & Honours
          </h3>
          <div className="space-y-3 flex-1">
            {electives.map((course, index) => {
              const isRegistered = existingRequest?.courseSelections?.some(
                (cs: any) => cs.courseId === course.id
              );
              return (
                <motion.label
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={course.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isRegistered
                      ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-75"
                      : selectedCourses.includes(course.id)
                      ? "border-amber-500 bg-amber-50 cursor-pointer"
                      : "border-slate-200 hover:border-amber-200 cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-amber-500 disabled:opacity-50"
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                    disabled={isRegistered}
                  />
                  <div>
                    <div className="font-medium text-slate-900">
                      {course.name}
                      {isRegistered && (
                        <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                          Registered
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span>{course.code}</span>
                      <span>•</span>
                      <span>{course.department.name}</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {course.category}
                      </span>
                    </div>
                  </div>
                </motion.label>
              );
            })}
            {electives.length === 0 && (
              <p className="text-slate-400 italic text-sm">
                No electives available for this semester.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-end gap-2">
        {existingRequest &&
          selectedCourses.length > 0 &&
          !selectedCourses.some(
            (id) =>
              !(
                existingRequest.courseSelections?.map(
                  (cs: any) => cs.courseId
                ) || []
              ).includes(id)
          ) && (
            <p className="text-sm text-slate-500 italic">
              Nothing more to apply for this semester.
            </p>
          )}
        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            selectedCourses.length === 0 ||
            (existingRequest &&
              !selectedCourses.some(
                (id) =>
                  !(
                    existingRequest.courseSelections?.map(
                      (cs: any) => cs.courseId
                    ) || []
                  ).includes(id)
              ))
          }
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          {loading ? (
            <>
              <Clock size={20} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              {existingRequest ? "Update Registration" : "Submit Registration"}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default SemesterRegister;
