import { Trash2 } from "lucide-react";
import type { Department } from "./DepartmentDashboard";

interface Props {
  departments: Department[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export default function DepartmentTable({
  departments,
  loading,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        Loading departments...
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        No departments found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left">Department Name</th>
            <th className="px-6 py-4 text-left">Department Code</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((dept) => (
            <tr
              key={dept.id}
              className="hover:bg-gray-50 border-b border-gray-200"
            >
              <td className="px-6 py-4">{dept.name}</td>

              <td className="px-6 py-4">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                  {dept.department_code}
                </span>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    dept.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {dept.status}
                </span>
              </td>

              <td className="px-6 py-4">
                <button
                  onClick={() => onDelete(dept.id)}
                  className="text-red-500 hover:text-red-700 hover:cursor-pointer"
                  title="Delete Department"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
