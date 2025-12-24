import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Bus, Users, MapPin, Phone, CreditCard } from "lucide-react";
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
  const { id } = useParams<{ id: string }>();
  const [bus, setBus] = useState<BusData | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "stops">("students");
  const [loading, setLoading] = useState(true);

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{bus.busName}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <Bus size={16} />
            Bus Number:
            <span className="font-semibold text-blue-600">{bus.busNumber}</span>
          </p>
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
            onClick={() => setActiveTab("students")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "students"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Students ({bus.students.length})
          </button>

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
    </div>
  );
};

export default BusDetailsPage;
