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
        const response = await fetch("http://localhost:3000/fee/");
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

  const handleSubmit = async () => {
    if (!selectedFeeId || !dueDate) {
      setError("Please select a fee structure and a due date.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/fee/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            disabled={submitting || loading}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:bg-teal-400"
          >
            {submitting ? "Assigning..." : "Assign Fee"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignFeeModal;
