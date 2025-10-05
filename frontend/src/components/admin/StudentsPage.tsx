import { useState, useEffect } from "react";
import StudentSummary from "../StudentSummary";
import StudentRow from "../StudentRow";
import { Search } from "lucide-react";

const baseURL = `http://localhost:3000`;

interface Student {
  id: number;
  name: string;
  program: string;
  department: string;
  year: number | null;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${baseURL}/admin/viewStats`);
        const data: StatItem[] = await response.json();
        console.log(data);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    const fetchStudents = async () => {
      try {
        const response = await fetch("http://localhost:3000/admin/students");
        const data = await response.json();
        const students: Student[] = data.students;

        setStudents(data.students);
        setPrograms(data.programs);
        const uniqueDepartments = Array.from(
          new Set(students.map((s) => s.department).filter(Boolean))
        );

        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStats();
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesName = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesProgram =
      selectedProgram === "All" || student.program === selectedProgram;
    const matchesDepartment =
      selectedProgram !== "B.Tech" ||
      selectedDepartment === "All" ||
      student.department === selectedDepartment;
    return matchesName && matchesProgram && matchesDepartment;
  });

  return (
    <>
      <div className="flex h-fit justify-between items-center">
        <div>
          <h2 className="font-bold text-3xl">Student Management</h2>
          <p className="mt-1 text-gray-400">
            View,Edit and Manage all students
          </p>
        </div>
        <button className="bg-black text-white h-fit p-2 rounded-[.3rem] cursor-pointer px-3">
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
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="flex items-center py-3 border-b border-gray-200 bg-gray-50">
          <div className="w-4/12 flex items-center pl-4">
            <input type="checkbox" className="mr-4" />
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
        </div>
        {filteredStudents.length === 0 ? (
          <p className="text-gray-500 text-center py-5">No students found.</p>
        ) : (
          <div className="flex flex-col gap-y-2">
            {filteredStudents.map((student) => (
              <StudentRow
                key={student.id}
                name={student.name}
                program={student.program}
                department={student.department}
                year={student.year}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentsPage;
