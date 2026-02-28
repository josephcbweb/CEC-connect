import React, { useState, useEffect } from "react";
import type { FeeStructure } from "../../types";

interface AssignFeeModalProps {
  studentIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

const AssignFeeModal: React.FC<AssignFeeModalProps> = ({
  studentIds,
  onClose,
  onSuccess,
}) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/fee/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setFeeStructures(await response.json());
        }
      } catch (err) {
        setError("Failed to load fee structures.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeeStructures();
  }, []);

  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!selectedFeeId || !dueDate) {
      setError("Please select a fee structure and a due date.");
      return;
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError("Please select a future date (at least tomorrow).");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/fee/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feeStructureId: parseInt(selectedFeeId),
          studentIds: studentIds,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to assign fees.");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Assign Fee to {studentIds.length} Student(s)
        </h2>
        {loading ? (
          <p>Loading fee structures...</p>
        ) : feeStructures.length === 0 ? (
          <div className="text-center py-4">
            <svg
              className="mx-auto h-12 w-12 text-yellow-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg text-gray-800 font-medium mb-2">
              No Fee Structures Found
            </p>
            <p className="text-sm text-gray-600">
              Please create a fee structure from the Manage Fee Structures panel
              before assigning fees to students.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="feeStructure"
                className="block text-sm font-medium text-gray-700"
              >
                Fee Structure
              </label>
              <select
                id="feeStructure"
                value={selectedFeeId}
                onChange={(e) => setSelectedFeeId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              >
                <option value="">Select a fee...</option>
                {feeStructures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} (₹{fs.amount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                min={getTomorrowStr()}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || feeStructures.length === 0}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Assigning..." : "Assign Fee"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignFeeModal;
