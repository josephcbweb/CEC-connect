// src/pages/admin/fees/components/FeeStructureTable.tsx
import React from "react";
import type { FeeDetails } from "../../types/fee";

interface FeeStructureTableProps {
  fees: FeeDetails[];
  loading: boolean;
  onEditFee: (fee: FeeDetails) => void;
  onFeeDeleted: () => void;
}

const FeeStructureTable: React.FC<FeeStructureTableProps> = ({
  fees,
  loading,
  onEditFee,
  onFeeDeleted,
}) => {
  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        const response = await fetch(`/api/fees/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Fee structure deleted successfully");
          onFeeDeleted();
        } else {
          alert("Failed to delete fee structure");
        }
      } catch (error) {
        console.error("Error deleting fee:", error);
        alert("Error deleting fee structure");
      }
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fee Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fees.map((fee) => (
            <tr key={fee.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {fee.feeType}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  ${fee.amount.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(fee.dueDate).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onEditFee(fee)}
                  className="text-teal-600 hover:text-teal-900 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(fee.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {fees.length === 0 && !loading && (
        <div className="px-6 py-8 text-center text-gray-500">
          No fee structures found. Create your first fee structure to get
          started.
        </div>
      )}
    </div>
  );
};

export default FeeStructureTable;
