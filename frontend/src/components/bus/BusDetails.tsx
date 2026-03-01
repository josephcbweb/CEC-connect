import { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bus,
  Users,
  MapPin,
  Phone,
  CreditCard,
  ArrowLeft,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import BusStatsCard from "./BusStatsCard";
import StudentTable from "./StudentTable";
import StopsList from "./StopsList";

const BASE_URL = "http://localhost:3000";

/* ---------------- TYPES ---------------- */

export interface BusStop {
  id: number;
  stopName: string;
  feeAmount: number;
}

export interface Student {
  id: number;
  name: string;
  student_phone_number: string;
  department: {
    name: string;
  };
  stopName: string;
  stopFee: number;
}

export interface BusData {
  busId: number;
  busName: string;
  busNumber: string;
  capacity: number;
  numberOfStudents: number;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  status: "Active" | "Inactive";
  stops: BusStop[];
  students: Student[];
}

/* ---------------- COMPONENT ---------------- */

const BusDetailsPage = () => {
  usePageTitle("Bus Details");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bus, setBus] = useState<BusData | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "stops">("stops");
  const [loading, setLoading] = useState(true);

  // Edit Driver State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingDriver, setIsSavingDriver] = useState(false);

  const fetchBusDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/bus/busDetails/${id}`);
      setBus(res.data);
    } catch (error) {
      console.error("Failed to fetch bus details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusDetails();
  }, [id]);

  const openEditModal = () => {
    if (bus) {
      setEditName(bus.driverName);
      setEditPhone(bus.driverPhone);
      setIsEditOpen(true);
    }
  };

  const saveDriverInfo = async () => {
    if (!editName.trim() || !editPhone.trim()) return;
    setIsSavingDriver(true);
    try {
      await axios.put(`${BASE_URL}/bus/updateDriver/${id}`, {
        driverName: editName,
        driverPhone: editPhone,
      });
      setIsEditOpen(false);
      fetchBusDetails(); // Automatically re-fetch to see changes
    } catch (error) {
      console.error("Failed to update driver details", error);
    } finally {
      setIsSavingDriver(false);
    }
  };

  if (loading || !bus) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading Bus Details...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-start">
          <button
            onClick={() => navigate("/admin/bus")}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-100 rounded-xl transition-colors mt-1"
            title="Back to Bus Management"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{bus.busName}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Bus size={16} />
              Bus Number:
              <span className="font-semibold text-blue-600">
                {bus.busNumber}
              </span>
            </p>
          </div>
        </div>

        <span
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            bus.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          ● {bus.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <BusStatsCard
          icon={<Users className="text-blue-500" />}
          label="Occupancy"
          value={`${bus.numberOfStudents} / ${bus.capacity}`}
        />
        <BusStatsCard
          icon={<Phone className="text-orange-500" />}
          label="Driver"
          value={bus.driverName}
          subValue={bus.driverPhone}
          action={
            <button
              onClick={openEditModal}
              className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-100 shadow-sm rounded-lg hover:bg-blue-50 transition-all active:scale-95"
              title="Edit Driver"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          }
        />
        <BusStatsCard
          icon={<CreditCard className="text-purple-500" />}
          label="Reg. Number"
          value={bus.registrationNumber}
        />
        <BusStatsCard
          icon={<MapPin className="text-red-500" />}
          label="Total Stops"
          value={bus.stops.length.toString()}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("stops")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "stops"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Route Stops & Fees
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "students"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Students ({bus.students.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === "students" ? (
            <StudentTable students={bus.students} />
          ) : (
            <StopsList
              stops={bus.stops}
              busId={bus.busId}
              refreshBusDetails={fetchBusDetails}
            />
          )}
        </div>
      </div>

      {/* Edit Driver Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Edit Driver Details
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="E.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="E.g. +91 9876543210"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isSavingDriver}
              >
                Cancel
              </button>
              <button
                onClick={saveDriverInfo}
                disabled={
                  isSavingDriver || !editName.trim() || !editPhone.trim()
                }
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDriver ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusDetailsPage;
