// src/pages/admin/fees/AdminFeesPage.tsx
import React, { useState, useEffect } from "react";
import type { FeeDetails } from "../../types/fee";
import AssignFeeForm from "./AssignFeeForm";
import FeeStructureTable from "./FeeStructureTable";
import CreateUpdateFeeModal from "./CreateUpdateFeeModal";

const AdminFeesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeDetails | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFeeStructures = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/fees");
      if (response.ok) {
        const data: FeeDetails[] = await response.json();
        setFeeStructures(data);
      }
    } catch (error) {
      console.error("Error loading fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeStructures();
  }, []);

  const handleEditFee = (fee: FeeDetails): void => {
    setEditingFee(fee);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setEditingFee(null);
  };

  const handleFeeCreated = (): void => {
    loadFeeStructures();
    handleCloseModal();
  };

  const handleFeeDeleted = (): void => {
    loadFeeStructures();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="mt-2 text-gray-600">
            Manage fee structures and assign fees to students
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Fee Assignment */}
          <div className="lg:col-span-1">
            <AssignFeeForm feeStructures={feeStructures} />
          </div>

          {/* Right Column - Fee Structures */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Fee Structures
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Create New Fee
                  </button>
                </div>
              </div>
              <FeeStructureTable
                fees={feeStructures}
                loading={loading}
                onEditFee={handleEditFee}
                onFeeDeleted={handleFeeDeleted}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create/Update Modal */}
      <CreateUpdateFeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingFee={editingFee}
        onSuccess={handleFeeCreated}
      />
    </div>
  );
};

export default AdminFeesPage;
