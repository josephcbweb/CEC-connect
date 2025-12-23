import { useNavigate } from "react-router-dom";
import { Bus, Eye } from "lucide-react";

interface BusType {
  id: number;
  busNumber: string;
  busName?: string;
  totalSeats: number;
  isActive: boolean;
  registrationNumber: string;
}

interface Props {
  bus: BusType;
}

const BusRow = ({ bus }: Props) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/admin/bus/${bus.id}`);
  };

  return (
    <tr className="hover:bg-blue-50/50 transition-colors duration-150">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">
            {bus.busNumber}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="text-gray-700 font-semibold">
          {bus.busName || "-"}
        </span>
      </td>

      <td className="px-6 py-4">
        {bus.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Inactive
          </span>
        )}
      </td>

      <td className="px-6 py-4">
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
          {bus.totalSeats} seats
        </span>
      </td>

      <td className="px-6 py-4">
        <button
          onClick={handleViewDetails}
          className="text-[#473CB4] font-medium hover:text-violet-800 hover:underline transition-colors"
        >
          Edit
        </button>
      </td>
    </tr>
  );
};

export default BusRow;
