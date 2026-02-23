import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import axios from "axios";

// Components
import BusTable from "./BusTable";
import AddBusModal from "./AddBusModal";
import BusStudentList from "./BusStudentList";
import BusFeeManager from "./BusFeeManager";
import BusRequestsTab from "./BusRequestsTab";
// New Component
import BusPaymentVerificationTab from "./BusPaymentVerificationTab"; 

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
  const [activeTab, setActiveTab] = useState("buses");
  const [refreshKey, setRefreshKey] = useState(0); // Added for syncing tabs

  // Modal States
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);

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

  const handleActionSuccess = () => {
    // When a request is approved, increment key to refresh the payments list
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Fleet Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Bus Management
              </h2>
              <p className="text-gray-500 mt-1">
                Oversee fleet logistics, student tracking, and fee assignments
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 overflow-x-auto">
          {[
            { id: "buses", label: "Bus List" },
            { id: "requests", label: "Requests" },
            { id: "payments", label: "Payments" }, // New Tab
            { id: "students", label: "Student List" },
            { id: "busFee", label: "Bus Fee" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 font-semibold text-sm transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600" />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Container */}
        <div className="bg-white shadow-xl rounded-b-xl overflow-hidden border border-gray-100">
          {/* 1. BUS LIST TAB */}
          {activeTab === "buses" && (
            <div className="animate-in fade-in duration-500">
              <div className="p-4 flex justify-end bg-gray-50/50 border-b border-gray-100">
                <button
                  className="py-2.5 px-6 bg-[#4134bd] text-white flex items-center gap-2 cursor-pointer font-semibold rounded-lg hover:bg-[#3529a3] transition-all active:scale-95 shadow-md shadow-violet-200"
                  onClick={() => setIsBusModalOpen(true)}
                >
                  <Plus className="w-5 h-5" /> Add New Bus
                </button>
              </div>
              <BusTable buses={buses} />
            </div>
          )}

          {/* 2. REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="animate-in fade-in duration-500">
              {/* Pass success handler to sync data across tabs */}
              <BusRequestsTab onActionSuccess={handleActionSuccess} />
            </div>
          )}

          {/* 3. PAYMENTS TAB (NEW) */}
          {activeTab === "payments" && (
            <div className="animate-in fade-in duration-500">
              <BusPaymentVerificationTab key={refreshKey} />
            </div>
          )}

          {/* 4. STUDENT LIST TAB */}
          {activeTab === "students" && (
            <div className="animate-in fade-in duration-500">
              <BusStudentList />
            </div>
          )}

          {/* 5. BUS FEE TAB */}
          {activeTab === "busFee" && (
            <div className="animate-in fade-in duration-500">
              <BusFeeManager />
            </div>
          )}
        </div>
      </div>

      {/* Global Modals */}
      <AddBusModal
        isOpen={isBusModalOpen}
        onClose={() => setIsBusModalOpen(false)}
        onSuccess={() => fetchBuses()}
      />
    </div>
  );
};

export default BusListPage;