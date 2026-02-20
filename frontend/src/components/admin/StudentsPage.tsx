import { useState, useEffect } from "react";
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
  department: string;
  year: number | null;
  currentSemester: number;
}

interface StatItem {
  title: string;
  count: number;
}

const StudentsPage = () => {
  const [viewStatus, setViewStatus] = useState<"approved" | "graduated">(
    "approved",
  );
  const [stats, setStats] = useState<StatItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("All");
  const [departments, setDepartments] = useState<string[]>([]);
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
  const [undoDeleteTimer, setUndoDeleteTimer] = useState<number | null>(
    null,
  );

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/students?status=${viewStatus}`);
      const data = await res.json();
      const students: Student[] = data.students;
      setStudents(students);
      setPrograms(data.programs);
      const uniqueDepartments = Array.from(
        new Set(students.map((s) => s.department).filter(Boolean)),
      );
      setDepartments(uniqueDepartments);
      // Calculate stats for Semester grouping if needed or just rely on backend
      // But typically, we want to group display by Semester if possible
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  useEffect(() => {
    setSelectedStudentIds([]); // Clear selection on view change
    const fetchStats = async () => {
      try {
        const res = await fetch(`${baseURL}/admin/viewStats`);
        const data: StatItem[] = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    Promise.all([fetchStats(), fetchStudents()])
      .catch((error) => console.error("Failed to fetch:", error))
      .finally(() => setLoading(false));
  }, [viewStatus]); // Re-fetch when viewStatus changes

  const filteredStudents = students.filter((student) => {
    const matchesName = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "All" || student.program === selectedProgram;
    const matchesDepartment =
      selectedProgram !== "BTECH" ||
      selectedDepartment === "All" ||
      student.department === selectedDepartment;
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

    departmentsToExport.forEach((dept) => {
      const filtered = students.filter((s) => {
        return (
          s.program === filters.program &&
          s.department === dept &&
          (!filters.year || filters.year.includes(s.year ?? 0))
        );
      });

      if (filtered.length === 0) return;

      // Department heading
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Department: ${dept}`, 14, currentY);
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
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "center" },
          4: { halign: "center" },
        },
        theme: "grid",
        didDrawPage: (data) => {
          if (data.cursor) {
            currentY = data.cursor.y + 10;
          }
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

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/admin/deleteStudents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedStudentIds }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        // Soft delete success
        setLastDeletedIds(selectedStudentIds);
        setShowUndoToast(true);
        setSelectedStudentIds([]);
        setIsDeleteModalOpen(false);
        fetchStudents();

        // 15 seconds timer to clear undo opportunity
        if (undoDeleteTimer) clearTimeout(undoDeleteTimer);
        const timer = setTimeout(() => {
          setShowUndoToast(false);
          setLastDeletedIds([]);
        }, 15000);
        setUndoDeleteTimer(timer);
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
      const response = await fetch(
        "http://localhost:3000/admin/restoreStudents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: lastDeletedIds }),
        },
      );
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
      const response = await fetch(
        "http://localhost:3000/admin/demoteStudents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedStudentIds }),
        },
      );
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

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
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
            View,Edit and Manage all students
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-md h-fit">
            <button
              onClick={() => setViewStatus("approved")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewStatus === "approved"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setViewStatus("graduated")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewStatus === "graduated"
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

      <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full my-4 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
        {stats.map((item) => (
          <div key={item.title} className="flex-1 min-w-[250px] max-w-[300px]">
            <div className="h-full flex flex-col">
              <StudentSummary title={item.title} count={item.count} />
            </div>
          </div>
        ))}
      </div>

      <hr className="border-t border-gray-200 my-6" />
      <div className="flex justify-end w-full gap-3 items-center">
        {selectedProgram === "BTECH" && (
          <div className="flex flex-wrap mb-6 ml-0 mr-auto bg-gray-100 p-1 rounded-[7px]">
            {["All", ...departments].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 text-sm font-medium ${selectedDepartment === dept
                  ? "bg-white text-indigo-800 border-gray-300 border rounded-lg"
                  : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200 cursor-pointer"
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

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
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="mb-6 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 font-semibold"
        >
          <option value="All">All</option>
          {programs.map((program) => (
            <option key={program} value={program}>
              {program}
            </option>
          ))}
        </select>
        {selectedProgram !== "All" && (
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="mb-6 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 font-semibold"
          >
            <option value="All">All Semesters</option>
            {/* Generate S1 to S8 */}
            {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
              <option key={sem} value={sem.toString()}>
                S{sem}
              </option>
            ))}
          </select>
        )}

        {selectedStudentIds.length > 0 && (
          <div className="flex gap-2">
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
          {/* Add the new Actions column header */}
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
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        studentCount={selectedStudentIds.length}
      />
      <PdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setisPdfModalOpen(false)}
        onGenerate={handleGeneratePDF}
        programs={programs}
        departments={departments}
      />

      {/* Undo Toast */}
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
