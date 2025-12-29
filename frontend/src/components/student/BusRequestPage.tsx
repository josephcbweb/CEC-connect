import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bus, MapPin, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

const BusServiceManager = () => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await axios.get(`http://localhost:3000/students/profile/${user.id}`);
      setStudent(res.data);
    } catch (err) {
      console.error("Error fetching student bus status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {student?.bus_service ? (
        // VIEW 1: Active Service Details
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-500 w-6 h-6" />
            <h2 className="text-2xl font-bold text-gray-800">Your Bus Service</h2>
          </div>
        </div>
      ) : (
        // VIEW 2: Enrollment Form
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl mb-8">
            <h2 className="text-2xl font-bold text-[#009689]">Avail College Bus Facility</h2>
            <p className="text-[#009689bf] mt-1">Join the safe and comfortable college commute network.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusServiceManager;