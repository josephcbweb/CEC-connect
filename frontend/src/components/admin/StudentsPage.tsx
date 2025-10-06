import { useState, useEffect } from "react";
import StudentSummary from "../StudentSummary";
import StudentRow from "../StudentRow";
import { Search } from "lucide-react";
import DeleteBtn from "./DeleteBtn";
import DeleteModal from "./DeleteModal";

const baseURL = `http://localhost:3000`;

interface Student {
  id: number;
  name: string;
  program: string;
  department: string;
  year: number | null;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

interface StatItem {
  title: string;
  count: number;
}

const StudentsPage = () => {
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

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/students`);
      const data = await res.json();
      const students: Student[] = data.students;
      setStudents(students);
      setPrograms(data.programs);
      const uniqueDepartments = Array.from(
        new Set(students.map((s) => s.department).filter(Boolean))
      );
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  useEffect(() => {
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
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesName = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "All" || student.program === selectedProgram;
    const matchesDepartment =
      selectedProgram !== "btech" ||
      selectedDepartment === "All" ||
      student.department === selectedDepartment;
    return matchesName && matchesProgram && matchesDepartment;
  });

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
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
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Deleted:", result.deletedCount);
        // Refresh students list
        fetchStudents();
        setSelectedStudentIds([]);
        setIsDeleteModalOpen(false);
      } else {
        console.error("Deletion failed:", result.error);
      }
    } catch (error) {
      console.error("Error deleting students:", error);
    }
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
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
        <button className="bg-teal-600 text-white h-fit p-2 rounded-[.3rem] cursor-pointer px-3">
          Export CSV
        </button>
      </div>

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
        {selectedProgram === "btech" && (
          <div className="flex flex-wrap mb-6 ml-0 mr-auto bg-gray-100 p-1 rounded-[7px]">
            {["All", ...departments].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedDepartment === dept
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
        {selectedStudentIds.length > 0 && (
          <DeleteBtn onClick={handleDeleteClick} />
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
                year={student.year}
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
    </div>
  );
};

export default StudentsPage;
