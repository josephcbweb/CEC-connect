import React, { useState, useEffect, useMemo } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import StudentFeeTable from "./StudentFeeTable";
import FeeStructuresPanel from "./FeeStructuresPanel";
import FilterBar from "./FilterBar";
import StatsCards from "./StatsCards";
import AssignFeeModal from "./AssignFeeModal";
import StudentDetailsModal from "./StudentDetailsModal";
import type { Student, StudentFee, SortConfig } from "../../types";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";

interface FilterConfig {
  department: string;
  branch: string;
  category: string;
  gender: string;
  feeStatus: string;
  program: string;
  semester: string;
  admission_type: string;
}

const getUniqueValues = <T, K extends keyof T>(
  items: T[],
  key: K,
): string[] => {
  const valueSet = new Set(items.map((item) => item[key]));
  return Array.from(valueSet).filter(Boolean) as string[];
};

const AdminFeesDashboard: React.FC = () => {
  usePageTitle("Fee Management");
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFeeStructures, setShowFeeStructures] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [filters, setFilters] = useState<FilterConfig>({
    department: "",
    branch: "",
    category: "",
    gender: "",
    feeStatus: "",
    program: "",
    semester: "",
    admission_type: "",
  });
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const token = localStorage.getItem("authToken");

  const canManageFeeStructures = hasAnyPermission([
    "fee:create_structure",
    "fee:update_structure",
    "fee:delete_structure",
  ]);
  const canAssignFee = hasPermission("fee:assign");

  if (!token) {
    navigate("/signup");
    return;
  }
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [viewingStudent, setViewingStudent] = useState<StudentFee | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<
    { id: number; name: string; department_code: string }[]
  >([]);

  const fetchStudents = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/students/all?include=invoices,feeDetails,department",
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const studentData: Student[] = await response.json();

      const studentsWithFees: StudentFee[] = studentData.map((student) => {
        const activeInvoices =
          student.invoices?.filter((inv) => !inv.fee?.archived) || [];
        const totalDue =
          activeInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        const totalPaid =
          activeInvoices
            ?.filter((inv) => inv.status === "paid")
            .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
        const pendingAmount = totalDue - totalPaid;

        let feeStatus: StudentFee["feeStatus"] = "pending";
        if (totalDue > 0) {
          if (pendingAmount <= 0) {
            feeStatus = "paid";
          } else {
            const hasOverdue = activeInvoices.some(
              (inv) =>
                inv.status !== "paid" && new Date(inv.dueDate) < new Date(),
            );
            feeStatus = hasOverdue ? "overdue" : "due";
          }
        }

        return { ...student, feeStatus, totalDue, totalPaid, pendingAmount };
      });
      setStudents(studentsWithFees);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const result = students.filter((student) => {
      // Search filter
      if (
        searchQuery &&
        !student.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Dropdown filters
      if (filters.department && student.department?.name !== filters.department)
        return false;
      if (filters.branch && student.allotted_branch !== filters.branch)
        return false;
      if (filters.category && student.category !== filters.category)
        return false;
      if (filters.gender && student.gender !== filters.gender) return false;
      if (filters.feeStatus && student.feeStatus !== filters.feeStatus)
        return false;
      if (filters.program && student.program !== filters.program) return false;
      if (
        filters.admission_type &&
        student.admission_type !== filters.admission_type
      )
        return false;
      if (
        filters.semester &&
        student.currentSemester?.toString() !== filters.semester
      )
        return false;
      return true;
    });

    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [students, filters, sortConfig, searchQuery]);

  const handleSort = (key: keyof StudentFee): void => {
    setSortConfig((prev: any) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: string): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedStudents([]);
  };

  const clearFilters = (): void => {
    const allPrograms = getUniqueValues(students, "program");
    const firstProgram = allPrograms[0] || "";
    const validDeptNames = availableDepartments.map((d) => d.name);

    setFilters({
      department: validDeptNames[0] || "",
      branch: "",
      category: "",
      gender: "",
      feeStatus: "",
      program: firstProgram,
      semester: "1",
      admission_type: "",
    });
    setSearchQuery("");
  };

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false);
    setSelectedStudents([]);
    alert("Fees assigned successfully!");
    fetchStudents();
  };

  const fetchDepartments = async (program: string) => {
    try {
      const url =
        program === "all" || !program
          ? "http://localhost:3000/api/departments"
          : `http://localhost:3000/api/departments?program=${program}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      console.log("FETCHED DEPARTMENTS API RESPONSE:", data);
      const depts = Array.isArray(data) ? data : data.data || [];
      console.log("PARSED INTO AVAILABLE DEPARTMENTS:", depts);
      setAvailableDepartments(depts);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setAvailableDepartments([]);
    }
  };

  useEffect(() => {
    if (students.length > 0 && !filters.program) {
      const allPrograms = getUniqueValues(students, "program");
      const firstProgram = allPrograms[0] || "";

      setFilters((prev) => ({
        ...prev,
        program: firstProgram,
        semester: "1",
      }));
    }
  }, [students]);

  useEffect(() => {
    if (filters.program) {
      fetchDepartments(filters.program);
    } else if (students.length > 0) {
      // Should not hit widely due to upper useEffect, but safety net
      const allPrograms = getUniqueValues(students, "program");
      if (allPrograms[0]) fetchDepartments(allPrograms[0]);
    }
  }, [filters.program, students.length]);

  useEffect(() => {
    if (availableDepartments.length > 0) {
      const validDeptNames = availableDepartments.map((d) => d.name);
      if (!filters.department || !validDeptNames.includes(filters.department)) {
        setFilters((prev) => ({
          ...prev,
          department: validDeptNames[0] || "",
        }));
      }
    } else if (availableDepartments.length === 0 && filters.department !== "") {
      setFilters((prev) => ({ ...prev, department: "" }));
    }
  }, [availableDepartments]);

  useEffect(() => {
    const isPG = filters.program === "MCA" || filters.program === "MTECH";
    const maxSem = isPG ? 4 : 8;

    setFilters((prev) => {
      let updated = false;
      const next = { ...prev };
      if (Number(prev.semester) > maxSem) {
        next.semester = "1";
        updated = true;
      }
      return updated ? next : prev;
    });
  }, [filters.program]);

  const filterOptions = useMemo(() => {
    const allPrograms = getUniqueValues(students, "program");
    const currentProgram = filters.program || allPrograms[0] || "";
    const isPG = currentProgram === "MCA" || currentProgram === "MTECH";

    return {
      departments: availableDepartments.map((d) => d.name),
      branches: getUniqueValues(students, "allotted_branch"),
      categories: getUniqueValues(students, "category"),
      programs: allPrograms,
      genders: getUniqueValues(students, "gender"),
      admission_types: getUniqueValues(students, "admission_type"),
      feeStatuses: ["pending", "due", "paid", "overdue"],
      semesters: isPG
        ? ["1", "2", "3", "4"]
        : ["1", "2", "3", "4", "5", "6", "7", "8"],
    };
  }, [students, availableDepartments, filters.program]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div
        className={`transition-transform duration-500 ease-in-out ${
          showFeeStructures ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Fee Management
              </h1>
              <p className="mt-2 text-gray-600">
                Dashboard for assigning and tracking student fee payments.
              </p>
            </div>
            {canManageFeeStructures && (
              <button
                onClick={() => setShowFeeStructures(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>Manage Fee Structures</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          <StatsCards students={filteredStudents} />
          <FilterBar
            {...filterOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />

          {selectedStudents.length > 0 && canAssignFee && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 my-6 flex items-center justify-between shadow-sm">
              <span className="font-medium text-teal-800">
                {selectedStudents.length} student(s) selected.
              </span>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 text-sm font-semibold"
              >
                Assign Fee Structure
              </button>
            </div>
          )}

          <StudentFeeTable
            students={filteredStudents}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            onViewDetails={setViewingStudent}
            onRefresh={fetchStudents}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
          />
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-white z-50 transition-transform duration-500 ease-in-out ${
          showFeeStructures ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <FeeStructuresPanel onClose={() => setShowFeeStructures(false)} />
      </div>

      {isAssignModalOpen && (
        <AssignFeeModal
          studentIds={selectedStudents}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {viewingStudent && (
        <StudentDetailsModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onRefresh={fetchStudents}
        />
      )}
    </div>
  );
};

export default AdminFeesDashboard;
