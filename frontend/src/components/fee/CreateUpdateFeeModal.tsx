// src/pages/admin/fees/components/CreateUpdateFeeModal.tsx
import React, { useState, useEffect } from "react";
import type { FeeDetails } from "../../types/fee";

interface CreateUpdateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFee: FeeDetails | null;
  onSuccess: () => void;
}

interface FormData {
  feeType: string;
  amount: string;
  dueDate: string;
}

interface FormErrors {
  feeType?: string;
  amount?: string;
  dueDate?: string;
}

const CreateUpdateFeeModal: React.FC<CreateUpdateFeeModalProps> = ({
  isOpen,
  onClose,
  editingFee,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    feeType: "",
    amount: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (editingFee) {
      setFormData({
        feeType: editingFee.feeType,
        amount: editingFee.amount.toString(),
        dueDate: new Date(editingFee.dueDate).toISOString().split("T")[0],
      });
    } else {
      setFormData({
        feeType: "",
        amount: "",
        dueDate: "",
      });
    }
    setErrors({});
  }, [editingFee, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.feeType.trim()) {
      newErrors.feeType = "Fee type is required";
    } else if (formData.feeType.length < 3) {
      newErrors.feeType = "Fee type must be at least 3 characters";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be positive";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        feeType: formData.feeType,
        amount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate).toISOString(),
        studentId: 1, // This should come from actual student context
      };

      const url = editingFee ? `/api/fees/${editingFee.id}` : "/api/fees";
      const method = editingFee ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(
          editingFee ? "Fee updated successfully!" : "Fee created successfully!"
        );
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save fee");
      }
    } catch (error) {
      console.error("Error saving fee:", error);
      alert("Error saving fee structure");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingFee ? "Edit Fee Structure" : "Create New Fee Structure"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Type
            </label>
            <input
              type="text"
              name="feeType"
              value={formData.feeType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Tuition Fee, Library Fee"
            />
            {errors.feeType && (
              <p className="mt-1 text-sm text-red-600">{errors.feeType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : editingFee ? "Update Fee" : "Create Fee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUpdateFeeModal;
