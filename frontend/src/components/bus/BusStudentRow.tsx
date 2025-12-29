import { useNavigate } from "react-router-dom";

interface Student {
  id: number;
  name: string;
  departmentCode: string;
  semester: string | number;
  phoneNumber?: string;
  busName: string;
}

interface StudentRowProps {
  student: Student;
}

const BusStudentRow = ({ student }: StudentRowProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition">
      {/* Name */}
      <div className="w-4/12 flex items-center pl-4">
        <span className="text-sm font-medium text-gray-800">
          {student.name}
        </span>
      </div>

      {/* Department */}
      <div className="w-3/12 px-2">
        <span className="text-sm text-gray-700">{student.departmentCode}</span>
      </div>

      {/* Semester ✅ FIXED */}
      <div className="w-2/12 px-2">
        <span className="text-sm text-gray-700">
          S{student.semester}
        </span>
      </div>

      {/* Bus Name */}
      <div className="w-3/12 px-2">
        <span className="text-sm text-gray-700">{student.busName || "-"}</span>
      </div>

      {/* Phone */}
      <div className="w-2/12 pr-4">
        <span className="text-sm text-gray-700">
          {student.phoneNumber || "-"}
        </span>
      </div>

      {/* Actions */}
      <div className="w-2/12 pr-4 text-right">
        <button className="text-sm text-indigo-600 hover:underline" onClick={() => navigate(`/admin/studentDetails/${student.id}`)}>
          View
        </button>
      </div>
    </div>
  );
};

export default BusStudentRow;
