import React, { useState, useEffect } from "react";
import type { FeeStructure } from "../../types";

// ============================================================================
// == CREATE/EDIT MODAL COMPONENT
// ============================================================================

interface CreateEditFeeStructureModalProps {
  feeStructure: FeeStructure | null;
  onClose: () => void;
  onSave: () => void;
}

type FeeStructureFormData = {
  name: string;
  description: string;
  amount: string;
};

const CreateEditFeeStructureModal: React.FC<
  CreateEditFeeStructureModalProps
> = ({ feeStructure, onClose, onSave }) => {
  const [formData, setFormData] = useState<FeeStructureFormData>({
    name: "",
    description: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = feeStructure != null;

  useEffect(() => {
    if (isEditMode && feeStructure) {
      setFormData({
        name: feeStructure.name,
        description: feeStructure.description || "",
        amount: String(feeStructure.amount),
      });
    } else {
      setFormData({ name: "", description: "", amount: "" });
    }
  }, [feeStructure, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.name.trim() || !formData.amount) {
      setError("Fee name and amount are required.");
      setIsSubmitting(false);
      return;
    }
    const numericAmount = parseFloat(formData.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        amount: numericAmount,
      };

      const url = isEditMode
        ? `http://localhost:3000/fee/${feeStructure!.id}`
        : "http://localhost:3000/fee/";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occurred.");
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative mx-auto p-8 border w-full max-w-lg shadow-lg rounded-xl bg-white">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? "Edit Fee Structure" : "Create New Fee Structure"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields... */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Fee Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Annual Tuition Fee 2024"
            />
          </div>
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              id="amount"
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., 50000"
              min="0"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Add any relevant details..."
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update Structure"
                : "Save Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// == MAIN PANEL COMPONENT
// ============================================================================

interface FeeStructuresPanelProps {
  onClose: () => void;
}

const FeeStructuresPanel: React.FC<FeeStructuresPanelProps> = ({ onClose }) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);

  const fetchFeeStructures = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/fee/");
      if (response.ok) {
        const data = await response.json();
        setFeeStructures(data);
      } else {
        console.error("Failed to fetch fee structures");
      }
    } catch (error) {
      console.error("Error fetching fee structures:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        const response = await fetch(`http://localhost:3000/fee/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchFeeStructures();
        } else {
          alert("Error deleting fee structure");
        }
      } catch (error) {
        console.error("Error deleting fee structure:", error);
        alert("Error deleting fee structure");
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingFee(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (fee: FeeStructure) => {
    setEditingFee(fee);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingFee(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchFeeStructures();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Fee Structures
              </h1>
              <p className="text-gray-600">Create and manage fee templates</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Create New Fee
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fee Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeStructures.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate">
                        {fee.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                        ₹{fee.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(fee)}
                          className="text-teal-600 hover:text-teal-900 mr-8 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feeStructures.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-gray-500 text-lg">
                    No fee structures found
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Create your first fee structure to get started
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conditionally render the modal */}
      {showModal && (
        <CreateEditFeeStructureModal
          feeStructure={editingFee}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default FeeStructuresPanel;
