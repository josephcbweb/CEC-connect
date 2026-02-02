import React, { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import AddCourseModal from "./AddCourseModal";

interface Course {
  id: number;
  name: string;
  code: string;
  type: "LAB" | "THEORY";
  category: "CORE" | "ELECTIVE" | "HONOURS";
  semester: number;
  department: {
    name: string;
    department_code: string;
  };
  isActive: boolean;
}

const CourseManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester =
      semesterFilter === "all" || course.semester.toString() === semesterFilter;
    return matchesSearch && matchesSemester;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Course Management
          </h1>
          <p className="text-slate-500">
            Manage theory and lab courses for all semesters
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCourses.map((course, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={course.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {course.code}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{course.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${course.type === "LAB"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                        }`}
                    >
                      {course.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${course.category === "CORE"
                          ? "bg-indigo-50 text-indigo-700"
                          : course.category === "ELECTIVE"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                    >
                      {course.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {course.department?.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    S{course.semester}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${course.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No courses found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AddCourseModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
};

export default CourseManager;
