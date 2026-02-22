import { useState, useEffect, useMemo } from "react";
import StudentSummary from "../StudentSummary";
import StudentRow from "../StudentRow";
import { Search } from "lucide-react";
import DeleteBtn from "./DeleteBtn";
import DeleteModal from "./DeleteModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PdfModal from "./PdfModal";
import PromotionModal from "./PromotionModal";
import { RotateCcw } from "lucide-react";

const baseURL = `http://localhost:3000`;

interface Student {
  id: number;
  name: string;
  program: string;
  department: string; // The short code (e.g., CSE)
  year: number | null;
  currentSemester: number;
}

// Interface to map codes to complete names
interface DepartmentInfo {
  name: string;
  department_code: string;
}

interface StatItem {
  title: string;
  count: number;
}

const StudentsPage = () => {
  const [viewStatus, setViewStatus] = useState<"approved" | "graduated">(
    "approved",
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("BTECH");
  const [departmentsInfo, setDepartmentsInfo] = useState<DepartmentInfo[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setisPdfModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | "All">(
    "All",
  );

  const [undoLoading, setUndoLoading] = useState(false);

  // Undo Delete State
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastDeletedIds, setLastDeletedIds] = useState<number[]>([]);
  const [undoDeleteTimer, setUndoDeleteTimer] = useState<number | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/students?status=${viewStatus}`);
      const data = await res.json();
      setStudents(data.students);
      setPrograms(data.programs);

      // Store the mapping of { name, department_code } from the backend
      setDepartmentsInfo(data.departments || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  useEffect(() => {
    setSelectedStudentIds([]); // Clear selection on view change
    fetchStudents().finally(() => setLoading(false));
  }, [viewStatus]);

  // 1. DYNAMIC STATS (Total Students + Complete Department Names)
  const derivedStats = useMemo(() => {
    const programStudents =
      selectedProgram === "All"
        ? students
        : students.filter((s) => s.program === selectedProgram);

    // Count by department short code
    const deptCounts = programStudents.reduce(
      (acc, student) => {
        const code = student.department || "Unknown";
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statsArray: StatItem[] = [
      {
        title: `Total ${selectedProgram !== "All" ? selectedProgram : ""} Students`,
        count: programStudents.length,
      },
      ...Object.entries(deptCounts).map(([code, count]) => {
        // Look up the complete name from departmentsInfo
        const deptObj = departmentsInfo.find(
          (d) =>
            d.department_code?.trim().toLowerCase() ===
              code.trim().toLowerCase() ||
            d.name?.trim().toLowerCase() === code.trim().toLowerCase(),
        );

        return {
          // If we found the mapping, use the complete name. If not, fallback to the code.
          title: deptObj ? deptObj.name : code,
          count,
        };
      }),
    ];

    return statsArray;
  }, [students, selectedProgram, departmentsInfo]);

  // 2. DYNAMIC BUTTONS (Only codes for the selected program)
  const derivedDepartmentCodes = useMemo(() => {
    const programStudents =
      selectedProgram === "All"
        ? students
        : students.filter((s) => s.program === selectedProgram);

    // Extract unique codes only for the currently viewed program
    const uniqueCodes = Array.from(
      new Set(programStudents.map((s) => s.department).filter(Boolean)),
    );

    return uniqueCodes.sort(); // Sort alphabetically for consistency
  }, [students, selectedProgram]);

  const filteredStudents = students.filter((student) => {
    const matchesName = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "All" || student.program === selectedProgram;
    const matchesDepartment =
      selectedDepartment === "All" || student.department === selectedDepartment;
    const matchesSemester =
      selectedSemester === "All" ||
      (student.currentSemester &&
        student.currentSemester.toString() === selectedSemester);

    return (
      matchesName && matchesProgram && matchesDepartment && matchesSemester
    );
  });

  const handleGeneratePDF = (filters: {
    program: string;
    departments?: string[];
    year?: number[];
  }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("College of Engineering, Cherthala", pageWidth / 2, 20, {
      align: "center",
    });

    const timestamp = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Report generated on: ${timestamp}`, pageWidth / 2, 28, {
      align: "center",
    });

    let currentY = 35;

    const departmentsToExport =
      filters.departments && filters.departments.length > 0
        ? filters.departments
        : Array.from(
            new Set(students.map((s) => s.department).filter(Boolean)),
          );

    departmentsToExport.forEach((deptCode) => {
      const filtered = students.filter((s) => {
        return (
          s.program === filters.program &&
          s.department === deptCode &&
          (!filters.year || filters.year.includes(s.year ?? 0))
        );
      });

      if (filtered.length === 0) return;

      const deptObj = departmentsInfo.find(
        (d) => d.department_code === deptCode,
      );
      const displayDept = deptObj ? deptObj.name : deptCode;

      // Department heading
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Department: ${displayDept}`, 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [["S.No", "Name", "Program", "Department", "Year"]],
        body: filtered.map((s, index) => [
          (index + 1).toString(),
          s.name,
          s.program,
          s.department,
          s.year?.toString() ?? "",
        ]),
        styles: {
          fontSize: 10,
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
          cellPadding: 4,
          valign: "middle",
          textColor: [50, 50, 50],
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          lineColor: [180, 180, 180],
          lineWidth: 0.5,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { halign: "center" }, 4: { halign: "center" } },
        theme: "grid",
        didDrawPage: (data) => {
          if (data.cursor) currentY = data.cursor.y + 10;
        },
      });
    });

    doc.save(`student_report_${filters.program}.pdf`);
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    if (selectedStudentIds.length === filteredIds.length) {
      setSelectedStudentIds([]); // Deselect all
    } else {
      setSelectedStudentIds(filteredIds); // Select all
    }
  };

  const handleDeleteClick = () => setIsDeleteModalOpen(true);

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${baseURL}/admin/deleteStudents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedStudentIds }),
      });

      const result = await response.json();

      if (response.ok) {
        setLastDeletedIds(selectedStudentIds);
        setShowUndoToast(true);
        setSelectedStudentIds([]);
        setIsDeleteModalOpen(false);
        fetchStudents();

        if (undoDeleteTimer) clearTimeout(undoDeleteTimer);
        const timer = setTimeout(() => {
          setShowUndoToast(false);
          setLastDeletedIds([]);
        }, 15000);
        setUndoDeleteTimer(timer as unknown as number);
      } else {
        console.error("Deletion failed:", result.error);
        alert("Failed to delete students");
      }
    } catch (error) {
      console.error("Error deleting students:", error);
    }
  };

  const handleUndoDelete = async () => {
    if (undoDeleteTimer) clearTimeout(undoDeleteTimer);
    try {
      const response = await fetch(`${baseURL}/admin/restoreStudents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: lastDeletedIds }),
      });
      if (response.ok) {
        fetchStudents();
        setShowUndoToast(false);
        setLastDeletedIds([]);
      } else {
        alert("Failed to restore students.");
      }
    } catch (error) {
      console.error("Error restoring students:", error);
    }
  };

  const handleDemote = async () => {
    if (
      !confirm(
        "Are you sure you want to apply Year Back to the selected students?",
      )
    )
      return;
    try {
      const response = await fetch(`${baseURL}/admin/demoteStudents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedStudentIds }),
      });
      if (response.ok) {
        alert("Students transferred back successfully.");
        fetchStudents();
        setSelectedStudentIds([]);
      } else {
        alert("Failed to transfer students.");
      }
    } catch (error) {
      console.error("Error demoting students:", error);
    }
  };

  const handleUndoPromotion = async () => {
    if (
      !window.confirm(
        "Are you sure you want to UNDO the last promotion batch? This will revert semester changes.",
      )
    )
      return;
    setUndoLoading(true);
    try {
      const res = await fetch(`${baseURL}/api/promotion/undo`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert("Promotion undone successfully.");
        fetchStudents();
      } else {
        alert(data.error || "Failed to undo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    } finally {
      setUndoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="flex h-fit justify-between items-center">
        <div>
          <h2 className="font-bold text-3xl">Student Management</h2>
          <p className="mt-1 text-gray-400">
            View, Edit and Manage all students
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1 rounded-md h-fit">
            <button
              onClick={() => setViewStatus("approved")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewStatus === "approved"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setViewStatus("graduated")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewStatus === "graduated"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Graduated
            </button>
          </div>

          <button
            onClick={handleUndoPromotion}
            disabled={undoLoading}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 h-fit p-2 rounded-[.3rem] cursor-pointer px-3"
            title="Undo Last Promotion"
          >
            <RotateCcw
              className={`w-4 h-4 ${undoLoading ? "animate-spin" : ""}`}
            />
            Undo
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-fit p-2 rounded-[.3rem] cursor-pointer px-3"
            onClick={() => setIsPromotionModalOpen(true)}
          >
            Promote Students
          </button>
          <button
            className="bg-teal-600 text-white h-fit p-2 rounded-[.3rem] cursor-pointer px-3"
            onClick={() => setisPdfModalOpen(true)}
          >
            Export PDF
          </button>
        </div>
      </div>

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        onSuccess={fetchStudents}
        allStudents={students}
      />

      <div className="flex mt-6 bg-gray-200/60 p-1 rounded-xl w-fit relative mb-4 shadow-inner">
        {["All", ...programs].map((prog) => (
          <button
            key={prog}
            onClick={() => {
              setSelectedProgram(prog);
              setSelectedDepartment("All"); // Reset department filter on program change
            }}
            className={`relative px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ease-in-out ${
              selectedProgram === prog
                ? "bg-white text-indigo-600 shadow-sm transform scale-100"
                : "text-gray-500 hover:text-gray-800 scale-95 hover:scale-100"
            }`}
          >
            {prog}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full mb-4 bg-gradient-to-r from-violet-50 to-blue-50 p-4 rounded-xl">
        {derivedStats.length > 0 ? (
          derivedStats.map((item) => (
            <div
              key={item.title}
              className="flex-1 min-w-[250px] max-w-[300px]"
            >
              <div className="h-full flex flex-col">
                <StudentSummary title={item.title} count={item.count} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 w-full text-center py-2">
            No students match this program.
          </p>
        )}
      </div>

      <hr className="border-t border-gray-200 my-6" />

      <div className="flex flex-wrap justify-between w-full gap-3 items-center">
        <div className="flex flex-wrap mb-6 ml-0 mr-auto bg-gray-100 p-1 rounded-[7px]">
          {/* "All" IS EXPLICITLY RENDERED FIRST */}
          <button
            onClick={() => setSelectedDepartment("All")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedDepartment === "All"
                ? "bg-white text-indigo-800 border-gray-300 border rounded-lg"
                : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 cursor-pointer"
            }`}
          >
            All
          </button>

          {/* DYNAMIC SHORT CODES RENDERED AFTER */}
          {derivedDepartmentCodes.map((code) => (
            <button
              key={code}
              onClick={() => setSelectedDepartment(code)}
              className={`px-4 py-2 text-sm font-medium ${
                selectedDepartment === code
                  ? "bg-white text-indigo-800 border-gray-300 border rounded-lg"
                  : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 cursor-pointer"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute top-2.5 left-3" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-6 w-full max-w-md px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          {selectedProgram !== "All" && (
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="mb-6 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 font-semibold"
            >
              <option value="All">All Semesters</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                <option key={sem} value={sem.toString()}>
                  S{sem}
                </option>
              ))}
            </select>
          )}

          {selectedStudentIds.length > 0 && (
            <div className="flex gap-2 mb-6">
              {selectedStudentIds.every((id) => {
                const student = students.find((s) => s.id === id);
                return (
                  student &&
                  student.currentSemester >= 4 &&
                  student.currentSemester <= 7
                );
              }) && (
                <button
                  onClick={handleDemote}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-fit p-2 rounded-[.3rem] cursor-pointer px-3 text-sm font-semibold"
                >
                  Year Back
                </button>
              )}
              <DeleteBtn onClick={handleDeleteClick} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="flex items-center py-3 border-b border-gray-200 bg-gray-50">
          <div className="w-4/12 flex items-center pl-4">
            <input
              type="checkbox"
              className="mr-4 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              onChange={handleSelectAllFiltered}
              checked={
                filteredStudents.length > 0 &&
                selectedStudentIds.length === filteredStudents.length
              }
            />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Name
              {selectedStudentIds.length > 0 && (
                <span className="text-violet-600">{` (${selectedStudentIds.length})`}</span>
              )}
            </span>
          </div>
          <div className="w-3/12 px-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Program
            </span>
          </div>
          <div className="w-3/12 px-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Department
            </span>
          </div>
          <div className="w-2/12 pr-4">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Year
            </span>
          </div>
          <div className="w-2/12 pr-4 text-right">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Actions
            </span>
          </div>
        </div>
        {filteredStudents.length === 0 ? (
          <p className="text-gray-500 text-center py-5">No students found.</p>
        ) : (
          <div className="flex flex-col gap-y-2">
            {filteredStudents.map((student) => (
              <StudentRow
                key={student.id}
                id={student.id}
                name={student.name}
                program={student.program}
                department={student.department}
                year={
                  student.currentSemester
                    ? Math.ceil(student.currentSemester / 2)
                    : student.year || null
                }
                currentSemester={student.currentSemester}
                isSelected={selectedStudentIds.includes(student.id)}
                onSelect={handleStudentSelect}
              />
            ))}
          </div>
        )}
      </div>
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        studentCount={selectedStudentIds.length}
      />
      <PdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setisPdfModalOpen(false)}
        onGenerate={handleGeneratePDF}
        programs={programs}
        departments={derivedDepartmentCodes} // Pass only relevant department codes to PDF generator
      />

      {showUndoToast && (
        <div className="fixed bottom-10 right-10 bg-gray-900 text-white px-6 py-4 rounded shadow-lg flex items-center gap-4 z-50 animate-bounce-in">
          <span>{lastDeletedIds.length} student(s) deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="text-teal-400 font-bold hover:underline"
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
