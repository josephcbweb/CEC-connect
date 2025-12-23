import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Bus, Users, MapPin, Phone, CreditCard, Plus } from "lucide-react";
import BusStatsCard from "./BusStatsCard";
import StudentTable from "./StudentTable";
import StopsList from "./StopsList";

export interface BusData {
  busId: number;
  busName: string;
  busNumber: string;
  capacity: number;
  numberOfStudents: number;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  status: string;
  stops: { id: number; stopName: string; feeAmount: number }[];
  students: {
    id: number;
    name: string;
    admission_number: string;
    student_phone_number: string;
    department: { name: string };
  }[];
}

const BusDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [bus, setBus] = useState<BusData | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "stops">("students");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3000/bus/busDetails/${id}`
        );
        setBus(response.data);
      } catch (err) {
        console.error("Error fetching bus details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (!bus)
    return <div className="p-10 text-center">Loading Bus Details...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{bus.busName}</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <Bus size={16} /> Bus Number:{" "}
            <span className="font-semibold text-blue-600">{bus.busNumber}</span>
          </p>
        </div>
        <div
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            bus.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          ● {bus.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <BusStatsCard
          icon={<Users className="text-blue-500" />}
          label="Occupancy"
          value={`${bus.numberOfStudents} / ${bus.capacity} Seats`}
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

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-4 font-medium transition-colors${
              activeTab === "students"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Student List ({bus.students.length})
          </button>
          <button
            onClick={() => setActiveTab("stops")}
            className={`px-6 py-4 font-medium transition-colors${
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
              refreshBusDetails={() => {
                axios
                  .get(`http://localhost:3000/bus/busDetails/${id}`)
                  .then((res) => setBus(res.data));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BusDetailsPage;
