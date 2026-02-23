import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AddCourseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: number;
  name: string;
  program: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "THEORY",
    category: "ELECTIVE",
    program: "",
    departmentId: "",
    semester: "1",
    staffId: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };

    // Fetch staff
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          const users = Array.isArray(result) ? result : result.data || [];
          setStaffList(users);
        }
      } catch (error) {
        console.error("Failed to fetch staff", error);
      }
    };

    fetchDepartments();
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl w-full max-w-md p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Add New Course
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="THEORY">Theory</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:bg-slate-100 disabled:text-slate-500"
                  value={formData.type === "LAB" ? "" : formData.category}
                  disabled={formData.type === "LAB"}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  <option value="CORE">Core</option>
                  <option value="ELECTIVE">Elective</option>
                  <option value="HONOURS">Honours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Program
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  value={formData.program}
                  onChange={(e) => {
                    const newProgram = e.target.value;
                    let newSemester = formData.semester;
                    if (
                      (newProgram === "MCA" || newProgram === "MTECH") &&
                      parseInt(newSemester) > 4
                    ) {
                      newSemester = "1";
                    }
                    setFormData({
                      ...formData,
                      program: newProgram,
                      departmentId: "",
                      semester: newSemester,
                    });
                  }}
                >
                  <option value="">Select Program</option>
                  <option value="BTECH">B.Tech</option>
                  <option value="MCA">MCA</option>
                  <option value="MTECH">M.Tech</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  required
                  disabled={!formData.program}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:bg-slate-100 disabled:text-slate-500"
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter((dept) => dept.program === formData.program)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                >
                  {(formData.program === "MCA" || formData.program === "MTECH"
                    ? [1, 2, 3, 4]
                    : [1, 2, 3, 4, 5, 6, 7, 8]
                  ).map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign Staff
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  value={formData.staffId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffId: e.target.value })
                  }
                >
                  <option value="">Select Staff</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.username} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddCourseModal;
