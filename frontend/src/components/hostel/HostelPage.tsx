import { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Loader2,
  Plus,
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  IndianRupee,
  Edit2,
  Building2,
  Receipt,
  Settings,
} from "lucide-react";
import axios from "axios";

// Components
import HostelCard from "./HostelCard";
import ResidentTable from "./ResidentTable";
import AddHostelModal from "./AddHostelModal";
import AssignStudentModal from "./AssignStudentModal";
import EditWardenModal from "./EditWardenModal";
import EditRentModal from "./EditRentModal";
import GenerateBillsModal from "./GenerateBillsModal";
import HostelFineSettingsModal from "./HostelFineSettingsModal";

import type { Hostel, Resident } from "./types";

const HostelPage = () => {
  usePageTitle("Hostel");
  // Data States
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);

  // Modal Visibility States
  const [isAddHostelModalOpen, setIsAddHostelModalOpen] = useState(false);
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] =
    useState(false);
  const [isEditWardenOpen, setIsEditWardenOpen] = useState(false);
  const [isEditRentOpen, setIsEditRentOpen] = useState(false);
  const [isGenerateBillsOpen, setIsGenerateBillsOpen] = useState(false);
  const [isFineSettingsOpen, setIsFineSettingsOpen] = useState(false);
  const [selectedResidentIds, setSelectedResidentIds] = useState<number[]>([]);

  // Fetch all hostels from backend
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:3000/api/hostel/fetchHostels",
      );
      setHostels(res.data.data);

      // If a hostel is currently selected, update its local state too
      if (selectedHostel) {
        const updatedHostel = res.data.data.find(
          (h: Hostel) => h.id === selectedHostel.id,
        );
        if (updatedHostel) setSelectedHostel(updatedHostel);
      }
    } catch (error) {
      console.error("Failed to fetch hostels", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students assigned to a specific hostel
  const fetchResidents = async (hostelId: number) => {
    try {
      setResidentsLoading(true);
      const res = await axios.get(
        `http://localhost:3000/api/hostel/fetchStudents/${hostelId}`,
      );
      setResidents(res.data.students);
    } catch (error) {
      console.error("Failed to fetch residents", error);
      setResidents([]);
    } finally {
      setResidentsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleHostelClick = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setSelectedResidentIds([]);
    fetchResidents(hostel.id);
  };

  const handleBackToHostels = () => {
    setSelectedHostel(null);
    setResidents([]);
    setSelectedResidentIds([]);
  };

  // handleGenerateBills is now integrated into GenerateBillsModal

  if (loading && hostels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading Hostels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedHostel && (
                <button
                  onClick={handleBackToHostels}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50/50 transition-all cursor-pointer shadow-sm group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {selectedHostel ? selectedHostel.name : "Hostel Management"}
                </h1>
                <p className="mt-1 text-gray-600">
                  {selectedHostel ? `Manage residents in ${selectedHostel.name}` : "Centralized residence management system"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Generate Bills Button */}
              <button
                onClick={() => setIsGenerateBillsOpen(true)}
                className="py-2.5 px-5 bg-indigo-600 text-white flex items-center gap-2 cursor-pointer font-semibold rounded-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
              >
                < Receipt className="w-4 h-4" />
                <span>Assign Rent {selectedResidentIds.length > 0 ? `(${selectedResidentIds.length})` : ""}</span>
              </button>

              {!selectedHostel && (
                <button
                  onClick={() => setIsFineSettingsOpen(true)}
                  className="py-2.5 px-5 bg-gray-900 text-white flex items-center gap-2 cursor-pointer font-semibold rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Config</span>
                </button>
              )}

              <button
                className="py-2.5 px-5 bg-teal-600 text-white flex items-center gap-2 cursor-pointer font-semibold rounded-lg hover:bg-teal-700 transition-all active:scale-95 shadow-sm"
                onClick={() =>
                  selectedHostel
                    ? setIsAssignStudentModalOpen(true)
                    : setIsAddHostelModalOpen(true)
                }
              >
                {selectedHostel ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Student</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>New Hostel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Info Cards */}
          {selectedHostel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Warden Card */}
              <div className="group relative bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative flex justify-between items-start">
                  <div className="flex gap-5">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-gray-100 group-hover:border-indigo-600 shadow-sm">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Resident Warden
                      </p>
                      <h4 className="text-xl font-bold text-gray-900">
                        {selectedHostel.wardenName}
                      </h4>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 group-hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:border-indigo-100 transition-colors">
                          <Phone className="w-3 h-3 text-gray-400 group-hover:text-indigo-500" />
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-indigo-700">{selectedHostel.wardenPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditWardenOpen(true)}
                    className="p-2.5 bg-gray-50 group-hover:bg-indigo-100 rounded-lg text-gray-400 group-hover:text-indigo-600 transition-all cursor-pointer border border-gray-100 group-hover:border-indigo-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Monthly Rent Card */}
              <div className="group relative bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative flex justify-between items-start">
                  <div className="flex gap-5">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 border border-gray-100 group-hover:border-teal-600 shadow-sm">
                      <IndianRupee className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Monthly Utility
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-sm font-semibold text-teal-600">₹</span>
                        <h4 className="text-3xl font-bold text-gray-900 leading-none">
                          {Number(selectedHostel.monthlyRent).toLocaleString("en-IN")}
                        </h4>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-teal-600 bg-teal-50/50 px-2.5 py-0.5 rounded-md border border-teal-100 inline-block">
                        Fixed Rate
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditRentOpen(true)}
                    className="p-2.5 bg-gray-50 group-hover:bg-teal-100 rounded-lg text-gray-400 group-hover:text-teal-600 transition-all cursor-pointer border border-gray-100 group-hover:border-teal-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        {selectedHostel ? (
          <div className="mt-4">
            <ResidentTable
              residents={residents}
              loading={residentsLoading}
              selectedResidentIds={selectedResidentIds}
              onSelectionChange={setSelectedResidentIds}
              onRefresh={() => {
                fetchResidents(selectedHostel.id);
                fetchHostels();
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-sm">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No hostels available. Start by adding one.
                </p>
              </div>
            ) : (
              hostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  onClick={() => handleHostelClick(hostel)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddHostelModal
        isOpen={isAddHostelModalOpen}
        onClose={() => setIsAddHostelModalOpen(false)}
        onSuccess={fetchHostels}
      />

      <AssignStudentModal
        isOpen={isAssignStudentModalOpen}
        onClose={() => setIsAssignStudentModalOpen(false)}
        hostels={hostels}
        selectedHostelId={selectedHostel?.id}
        onSuccess={() => {
          if (selectedHostel) fetchResidents(selectedHostel.id);
          fetchHostels();
        }}
      />

      <EditWardenModal
        isOpen={isEditWardenOpen}
        onClose={() => setIsEditWardenOpen(false)}
        hostel={selectedHostel}
        onSuccess={fetchHostels}
      />

      <EditRentModal
        isOpen={isEditRentOpen}
        onClose={() => setIsEditRentOpen(false)}
        hostel={selectedHostel}
        onSuccess={fetchHostels}
      />

      <GenerateBillsModal
        isOpen={isGenerateBillsOpen}
        onClose={() => setIsGenerateBillsOpen(false)}
        selectedStudentIds={selectedResidentIds}
        onSuccess={(msg) => {
          alert(msg);
          setSelectedResidentIds([]);
          if (selectedHostel) fetchResidents(selectedHostel.id);
        }}
      />

      <HostelFineSettingsModal
        isOpen={isFineSettingsOpen}
        onClose={() => setIsFineSettingsOpen(false)}
      />
    </div>
  );
};

export default HostelPage;
