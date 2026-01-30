import { Trash2, UserCog } from "lucide-react";
import type { Department } from "./DepartmentDashboard";

interface Props {
  departments: Department[];
  loading: boolean;
  onDelete: (dept: Department) => void;
  onChangeHod: (dept: Department) => void;
}

export default function DepartmentTable({ departments, loading, onDelete, onChangeHod }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Head of Department
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No departments found
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr
                  key={dept.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {dept.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {dept.department_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {dept.hodDetails?.user?.username || (
                        <span className="text-gray-400 italic">No HOD Assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${dept.status === "ACTIVE"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${dept.status === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-red-500"
                          }`}
                      />
                      {dept.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onChangeHod(dept)}
                        title="Change HOD"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(dept)}
                        title="Delete Department"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
