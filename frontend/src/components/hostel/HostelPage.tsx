import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  IndianRupee,
  Edit2,
  Building2, // Add this here
} from "lucide-react";
import axios from "axios";

// Components
import HostelCard from "./HostelCard";
import ResidentTable from "./ResidentTable";
import AddHostelModal from "./AddHostelModal";
import AssignStudentModal from "./AssignStudentModal";
import EditWardenModal from "./EditWardenModal";
import EditRentModal from "./EditRentModal";

// Exporting interfaces so sub-components (like ResidentTable) can use them
export interface Hostel {
  id: number;
  name: string;
  wardenName: string;
  wardenPhone: string;
  monthlyRent: number;
  _count: {
    students: number;
  };
}

export interface Resident {
  id: number;
  name: string;
  phone: string;
  semester: number;
  className: string;
}

const HostelPage = () => {
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

  // Fetch all hostels from backend
  const fetchHostels = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:3000/api/hostel/fetchHostels",
      );
      setHostels(res.data.data);

      // If a hostel is currently selected, update its local state too (for Warden/Rent changes)
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
    fetchResidents(hostel.id);
  };

  const handleBackToHostels = () => {
    setSelectedHostel(null);
    setResidents([]);
  };

  if (loading && hostels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Loading Hostels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedHostel && (
                <button
                  onClick={handleBackToHostels}
                  className="p-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-600" />
                </button>
              )}
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                  {selectedHostel ? selectedHostel.name : "Hostel Management"}
                </h2>
                {!selectedHostel && (
                  <p className="text-zinc-500 mt-1">
                    Manage student accommodation and assignments
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="py-2.5 px-5 bg-violet-600 text-white flex items-center gap-2 cursor-pointer font-medium rounded-lg hover:bg-violet-700 transition-all shadow-sm"
                onClick={() =>
                  selectedHostel
                    ? setIsAssignStudentModalOpen(true)
                    : setIsAddHostelModalOpen(true)
                }
              >
                {selectedHostel ? (
                  <>
                    <UserPlus className="w-4 h-4" /> Assign Student
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add Hostel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Info Cards - Only shown when a hostel is selected */}
          {selectedHostel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Warden Card */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                      Warden In-Charge
                    </p>
                    <h4 className="text-xl font-bold text-zinc-900 mt-1">
                      {selectedHostel.wardenName}
                    </h4>
                    <p className="text-sm text-zinc-600 flex items-center gap-2 mt-1 bg-zinc-50 px-2 py-1 rounded-md w-fit">
                      <Phone className="w-3.5 h-3.5" />{" "}
                      {selectedHostel.wardenPhone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditWardenOpen(true)}
                  className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-violet-600 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Monthly Rent Card */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                      Monthly Rent
                    </p>
                    <h4 className="text-3xl font-black text-zinc-900 mt-1">
                      ₹
                      {Number(selectedHostel.monthlyRent).toLocaleString(
                        "en-IN",
                      )}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-2 italic uppercase font-bold">
                      Base rate for this building
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditRentOpen(true)}
                  className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        {selectedHostel ? (
          <div className="mt-4">
            <ResidentTable residents={residents} loading={residentsLoading} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-zinc-200">
                <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 text-lg font-medium">
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
    </div>
  );
};

export default HostelPage;
