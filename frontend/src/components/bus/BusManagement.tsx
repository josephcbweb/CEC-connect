import { useEffect, useState } from "react";
import { Bus, Loader2, Plus } from "lucide-react";
import BusTable from "./BusTable";
import AddBusModal from "./AddBusModal";
import axios from "axios";

export interface Bus {
  id: number;
  busNumber: string;
  busName?: string;
  totalSeats: number;
  isActive: boolean;
  registrationNumber: string;
}

const BusListPage = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busFeeEnabled, setBusFeeEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  useEffect(() => {
    fetchBuses();
    axios
      .get("http://localhost:3000/bus/busFeeStatus")
      .then((res) => setBusFeeEnabled(res.data.enabled))
      .catch(() => {});
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await fetch("http://localhost:3000/bus/fetchbus");
      const data = await res.json();
      setBuses(data.buses);
    } catch (error) {
      console.error("Failed to fetch buses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = () => {
    setPendingValue(!busFeeEnabled);
    setShowConfirmModal(true);
  };

  const confirmToggle = async () => {
    if (pendingValue === null) return;

    try {
      setToggleLoading(true);

      await axios.put("http://localhost:3000/bus/toggleBusFee", {
        enabled: pendingValue,
      });

      setBusFeeEnabled(pendingValue);
    } catch {
      alert("Failed to update bus fee setting");
    } finally {
      setToggleLoading(false);
      setShowConfirmModal(false);
      setPendingValue(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2 justify-between">
            {/* <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Bus className="w-6 h-6 text-white" />
            </div> */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Bus Management
              </h2>
              <p className="text-gray-600 mt-1">
                Manage and monitor your fleet
              </p>
            </div>
            <button
              className="w-fit h-fit py-2 px-5 bg-[#4134bd] text-white flex justify-center items-center gap-2 cursor-pointer text-[1.1rem] border rounded-[7px]"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-5 h-5" /> Add Bus
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <BusTable buses={buses} />
        </div>
        <div className="mt-6 bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Enable Bus Fee
            </h3>
            <p className="text-sm text-gray-500">
              Allow students to view and pay bus fees based on their stop
            </p>
          </div>

          <button
            onClick={handleToggleClick}
            disabled={toggleLoading}
            className={`cursor-pointer relative w-14 h-7 rounded-full transition
    ${busFeeEnabled ? "bg-[#00786F]" : "bg-gray-300"}
    ${toggleLoading ? "opacity-60 cursor-not-allowed" : ""}
  `}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
        ${busFeeEnabled ? "translate-x-7" : ""}
      `}
            />
          </button>
        </div>
      </div>

      <AddBusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchBuses(); // Refresh the bus list
        }}
      />
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {pendingValue ? "Enable Bus Fee?" : "Disable Bus Fee?"}
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              {pendingValue
                ? "Students will be able to view and pay bus fees based on their stop."
                : "Students will no longer be able to view or pay bus fees."}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingValue(null);
                }}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={confirmToggle}
                disabled={toggleLoading}
                className={`px-4 py-2 rounded-lg text-white cursor-pointer
            ${
              pendingValue
                ? "bg-[#00786F] hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          `}
              >
                {toggleLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusListPage;
