import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Ban, CheckCircle } from "lucide-react";

interface Student {
  id: number;
  name: string;
  departmentCode: string;
  semester: string | number;
  phoneNumber?: string;
  busName: string;
  is_bus_pass_suspended?: boolean;
  bus_pass_suspended_until?: string | null;
}

interface StudentRowProps {
  student: Student;
  onRemove: (studentId: number) => void;
  onSuspend: (studentId: number, days: number) => void;
  onReactivate: (studentId: number) => void;
}

const BusStudentRow = ({ student, onRemove, onSuspend, onReactivate }: StudentRowProps) => {
  const navigate = useNavigate();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendDays, setSuspendDays] = useState(1);

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${student.name} from bus service?`)) {
      onRemove(student.id);
    }
  };

  const submitSuspend = () => {
    onSuspend(student.id, suspendDays);
    setShowSuspendModal(false);
    setSuspendDays(1);
  };

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

      {/* Semester */}
      <div className="w-2/12 px-2">
        <span className="text-sm text-gray-700">
          S{student.semester}
        </span>
      </div>

      {/* Bus Name */}
      <div className="w-3/12 px-2">
        <span className="text-sm text-gray-700">{student.busName || "-"}</span>
      </div>

      {/* Phone & Status */}
      <div className="w-2/12 pr-4 flex flex-col justify-center">
        <span className="text-sm text-gray-700">
          {student.phoneNumber || "-"}
        </span>
        {student.is_bus_pass_suspended ? (
          <span className="text-xs text-red-600 font-semibold mt-1">
            Suspended
          </span>
        ) : (
          <span className="text-xs text-green-600 font-semibold mt-1">
            Active
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="w-2/12 pr-4 flex items-center justify-end gap-3">
        <button className="text-sm text-indigo-600 hover:underline" onClick={() => navigate(`/admin/studentDetails/${student.id}`)}>
          View
        </button>
        {student.is_bus_pass_suspended ? (
          <button
            className="text-green-500 hover:text-green-700 transition"
            onClick={() => onReactivate(student.id)}
            title="Reactivate bus pass"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="text-orange-500 hover:text-orange-700 transition"
            onClick={() => setShowSuspendModal(true)}
            title="Suspend bus pass"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
        <button
          className="text-red-500 hover:text-red-700 transition"
          onClick={handleRemove}
          title="Remove from bus"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Suspend Bus Pass</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter number of days for suspending the bus pass of <strong>{student.name}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days
              </label>
              <input
                type="number"
                min="1"
                value={suspendDays}
                onChange={(e) => setSuspendDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowSuspendModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                onClick={submitSuspend}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusStudentRow;
