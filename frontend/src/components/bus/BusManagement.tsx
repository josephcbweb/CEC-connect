import { useEffect, useState } from "react";
import { Bus, Loader2, Plus } from "lucide-react";
import BusTable from "./BusTable";
import AddBusModal from "./AddBusModal";

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

  useEffect(() => {
    fetchBuses();
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
      </div>
      <AddBusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchBuses(); // Refresh the bus list
        }}
      />
    </div>
  );
};

export default BusListPage;
