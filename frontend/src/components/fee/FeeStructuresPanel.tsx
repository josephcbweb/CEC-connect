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

interface FineSlabDraft {
  startDay: string;
  endDay: string;
  amountPerDay: string;
}

type FeeStructureFormData = {
  name: string;
  description: string;
  amount: string;
  fineEnabled: boolean;
  fineSlabs: FineSlabDraft[];
};

const CreateEditFeeStructureModal: React.FC<
  CreateEditFeeStructureModalProps
> = ({ feeStructure, onClose, onSave }) => {
  const [formData, setFormData] = useState<FeeStructureFormData>({
    name: "",
    description: "",
    amount: "",
    fineEnabled: false,
    fineSlabs: [],
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
        fineEnabled: feeStructure.fineEnabled || false,
        fineSlabs:
          feeStructure.fineSlabs?.map((s) => ({
            startDay: String(s.startDay),
            endDay: s.endDay !== null ? String(s.endDay) : "",
            amountPerDay: String(s.amountPerDay),
          })) || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        amount: "",
        fineEnabled: false,
        fineSlabs: [],
      });
    }
  }, [feeStructure, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlab = () => {
    const slabs = formData.fineSlabs;
    const lastSlab = slabs[slabs.length - 1];
    // Auto-fill startDay as lastSlab.endDay + 1
    const newStartDay =
      lastSlab && lastSlab.endDay
        ? String(parseInt(lastSlab.endDay) + 1)
        : slabs.length === 0
          ? "1"
          : "";

    setFormData((prev) => ({
      ...prev,
      fineSlabs: [
        ...prev.fineSlabs,
        { startDay: newStartDay, endDay: "", amountPerDay: "" },
      ],
    }));
  };

  const handleRemoveSlab = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fineSlabs: prev.fineSlabs.filter((_, i) => i !== index),
    }));
  };

  const handleSlabChange = (
    index: number,
    field: keyof FineSlabDraft,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      fineSlabs: prev.fineSlabs.map((slab, i) =>
        i === index ? { ...slab, [field]: value } : slab,
      ),
    }));
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

    // Validate fine slabs if enabled
    if (formData.fineEnabled && formData.fineSlabs.length > 0) {
      for (let i = 0; i < formData.fineSlabs.length; i++) {
        const slab = formData.fineSlabs[i];
        const start = parseInt(slab.startDay);
        const end = slab.endDay ? parseInt(slab.endDay) : null;
        const amt = parseFloat(slab.amountPerDay);

        if (isNaN(start) || start < 1) {
          setError(`Fine period ${i + 1}: Start day must be at least 1.`);
          setIsSubmitting(false);
          return;
        }
        if (end !== null && (isNaN(end) || end < start)) {
          setError(
            `Fine period ${i + 1}: End day must be greater than or equal to start day.`,
          );
          setIsSubmitting(false);
          return;
        }
        if (isNaN(amt) || amt <= 0) {
          setError(
            `Fine period ${i + 1}: Amount per day must be a positive number.`,
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const fineSlabs = formData.fineEnabled
        ? formData.fineSlabs.map((s) => ({
            startDay: parseInt(s.startDay),
            endDay: s.endDay ? parseInt(s.endDay) : null,
            amountPerDay: parseFloat(s.amountPerDay),
          }))
        : [];

      const payload = {
        name: formData.name,
        description: formData.description || null,
        amount: numericAmount,
        fineEnabled: formData.fineEnabled,
        fineSlabs,
      };

      const url = isEditMode
        ? `http://localhost:3000/fee/${feeStructure!.id}`
        : "http://localhost:3000/fee/";
      const method = isEditMode ? "PUT" : "POST";

      const token = localStorage.getItem("authToken");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      <div className="relative mx-auto p-8 border w-full max-w-2xl shadow-lg rounded-xl bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? "Edit Fee Structure" : "Create New Fee Structure"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fee Name */}
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
          {/* Amount */}
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
          {/* Description */}
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

          {/* Fine Configuration Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Overdue Fine
                </h4>
                <p className="text-sm text-gray-500">
                  Add daily fine charges for late payments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fineEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fineEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {formData.fineEnabled && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Define fine periods starting from the due date. "Start day"
                  and "End day" refer to the number of days after the due date.
                  Leave "End day" empty for the last period to make it
                  open-ended.
                </p>

                {formData.fineSlabs.map((slab, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Start Day
                      </label>
                      <input
                        type="number"
                        value={slab.startDay}
                        onChange={(e) =>
                          handleSlabChange(index, "startDay", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        End Day{" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={slab.endDay}
                        onChange={(e) =>
                          handleSlabChange(index, "endDay", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="∞"
                        min="1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        ₹ / Day
                      </label>
                      <input
                        type="number"
                        value={slab.amountPerDay}
                        onChange={(e) =>
                          handleSlabChange(
                            index,
                            "amountPerDay",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="5"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlab(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove period"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSlab}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Fine Period
                </button>
              </div>
            )}
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
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/fee/", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        const token = localStorage.getItem("authToken");
        const response = await fetch(`http://localhost:3000/fee/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fine
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {fee.fineEnabled ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                            title={
                              fee.fineSlabs
                                ?.map(
                                  (s) =>
                                    `Day ${s.startDay}${
                                      s.endDay ? `-${s.endDay}` : "+"
                                    }: ₹${s.amountPerDay}/day`,
                                )
                                .join(", ") || "Enabled"
                            }
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {fee.fineSlabs?.length || 0} period
                            {(fee.fineSlabs?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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
