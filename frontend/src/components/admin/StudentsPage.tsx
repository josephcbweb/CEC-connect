import { useState, useEffect } from "react";
import StudentSummary from "../StudentSummary";
import StudentRow from "../StudentRow";

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
        const data: Student[] = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStats();
    fetchStudents();
  }, []);

  return (
    <>
      {/* ... your page title and stats sections remain the same */}
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

      <div className="bg-white rounded-lg shadow border border-gray-200">
        {/* Table Header */}
        {/* --- REMOVE px-4 from this div --- */}
        <div className="flex items-center py-3 border-b border-gray-200 bg-gray-50">
          {/* --- ADD padding (pl-4) to the first column --- */}
          <div className="w-4/12 flex items-center pl-4">
            <input type="checkbox" className="mr-4" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Name
            </span>
          </div>

          {/* --- ADD padding (px-2) to middle columns for spacing --- */}
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

          {/* --- ADD padding (pr-4) to the last column --- */}
          <div className="w-2/12 pr-4">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Year
            </span>
          </div>
        </div>

        {/* Student List */}
        <div>
          {students.map((student) => (
            <StudentRow key={student.id} {...student} />
          ))}
        </div>
      </div>
    </>
  );
};

export default StudentsPage;
