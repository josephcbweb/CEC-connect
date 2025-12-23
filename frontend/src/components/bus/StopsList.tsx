import React, { useState } from "react";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import AddStopModal from "./AddStopModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface Stop {
  id: number;
  stopName: string;
  feeAmount: number;
}

interface Props {
  stops: Stop[];
  busId: number;
  refreshBusDetails: () => void;
}

const StopsList: React.FC<Props> = ({
  stops,
  busId,
  refreshBusDetails,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [stopToDelete, setStopToDelete] = useState<Stop | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteConfirm = async () => {
    if (!stopToDelete) return;

    try {
      setDeletingId(stopToDelete.id);

      await axios.delete(
        `http://localhost:3000/bus/deleteStop/${stopToDelete.id}`
      );

      refreshBusDetails();
      setStopToDelete(null); // close modal
    } catch (error) {
      console.error("Error deleting stop:", error);
      alert("Failed to delete stop");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Route Details
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md"
        >
          <Plus size={18} /> Add Stop & Fee
        </button>
      </div>

      {/* Stops List */}
      <div className="space-y-3">
        {stops.length === 0 && (
          <p className="text-gray-500 text-sm text-center">
            No stops added yet
          </p>
        )}

        {stops.map((stop, index) => (
          <div
            key={stop.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <span className="font-medium text-gray-700">
                {stop.stopName}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Fee Amount</p>
                <p className="font-bold text-green-600">
                  ₹{stop.feeAmount}
                </p>
              </div>

              {/* Delete Icon */}
              <button
                onClick={() => setStopToDelete(stop)}
                disabled={deletingId === stop.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                title="Delete stop"
              >
                {deletingId === stop.id ? (
                  <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Stop Modal */}
      {showAddModal && (
        <AddStopModal
          busId={busId}
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshBusDetails}
        />
      )}

      {/* Delete Confirmation Modal */}
      {stopToDelete && (
        <DeleteConfirmModal
          loading={deletingId === stopToDelete.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setStopToDelete(null)}
        />
      )}
    </div>
  );
};

export default StopsList;
