import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

interface AddStopModalProps {
  busId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddStopModal: React.FC<AddStopModalProps> = ({
  busId,
  onClose,
  onSuccess,
}) => {
  const [stopName, setStopName] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stopName || !feeAmount) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:3000/bus/addStop", {
        busId,
        stops: [
          {
            stopName,
            feeAmount: Number(feeAmount),
          },
        ],
      });

      onSuccess(); // refresh list
      onClose(); // close modal
    } catch (error) {
      console.error("Error adding stop:", error);
      alert("Failed to add stop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Add Bus Stop & Fee
          </h2>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Stop Name
            </label>
            <input
              type="text"
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Eg: Central Station"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Fee Amount (₹)
            </label>
            <input
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Eg: 1500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Stop"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStopModal;
