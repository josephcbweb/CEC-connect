import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Bus,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  IndianRupee,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Select, ConfigProvider } from "antd";

// Interfaces
interface BusStop {
  id: number;
  stopName: string;
  feeAmount: number;
}

interface BusRoute {
  id: number;
  busNumber: string;
  busName: string;
  stops: BusStop[];
}

interface StudentContext {
  studentData: any;
}

const BusServiceManager = () => {
  const { studentData } = useOutletContext<StudentContext>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buses, setBuses] = useState<BusRoute[]>([]);

  // Form State
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [selectedStop, setSelectedStop] = useState<number | null>(null);
  const [feePreview, setFeePreview] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived info
  const activeBus = buses.find(b => b.id === selectedBus);
  const availableStops = activeBus?.stops || [];

  const fetchStudentData = async () => {
    try {
      const studentId = studentData?.id || JSON.parse(localStorage.getItem("studentAuthToken") || "{}").userId;

      if (!studentId) return;

      const profileRes = await axios.get(`http://localhost:3000/students/profile/${studentId}`);
      setStudent(profileRes.data);

      // Also fetch buses
      const busesRes = await axios.get("http://localhost:3000/students/bus/routes");
      setBuses(busesRes.data);

    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to load bus service details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentData]);

  const handleBusChange = (busId: number) => {
    setSelectedBus(busId);
    setSelectedStop(null);
    setFeePreview(null);
  };

  const handleStopChange = (stopId: number) => {
    setSelectedStop(stopId);
    const stop = availableStops.find(s => s.id === stopId);
    setFeePreview(stop ? stop.feeAmount : null);
  };

  const handleSubmit = async () => {
    if (!selectedBus || !selectedStop || !student) return;

    setSubmitting(true);
    try {
      const studentId = studentData?.id;

      await axios.post("http://localhost:3000/students/request-bus", {
        studentId: studentId,
        busId: selectedBus,
        busStopId: selectedStop
      });

      // Refresh data
      await fetchStudentData();

    } catch (err: any) {
      console.error("Submission error", err);
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#009689] w-12 h-12" /></div>;

  // ─── CASE E: Suspended (bus_service: true AND hasUnpaidBusFee: true) ───
  if (student?.bus_service && student?.hasUnpaidBusFee) {
    const { busName, busNumber, stopName } = student.busDetails || {};
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 p-6 text-white flex items-center gap-4">
            <div className="bg-red-500/30 w-14 h-14 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pass Suspended</h1>
              <p className="opacity-90 text-sm">Bus facility temporarily disabled</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-red-100 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Pending Dues Detected</h3>
                <p className="text-gray-600 mt-1">
                  Your bus pass for <strong>{busName}</strong> ({busNumber}) at <strong>{stopName}</strong> has been
                  suspended due to unpaid bus fees. Please clear outstanding dues to reactivate your pass.
                </p>
              </div>
            </div>

            <div className="bg-red-100/50 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Status: SUSPENDED — Contact the accounts office to resolve pending fees
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CASE D: Active Pass (bus_service: true AND hasUnpaidBusFee: false) ───
  if (student?.bus_service && !student?.hasUnpaidBusFee && student?.busDetails) {
    const { busName, busNumber, stopName, feeAmount } = student.busDetails;
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#009689] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Active Service</h1>
                <p className="opacity-90">Bus Facility Enabled</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Reg No</p>
              <p className="font-mono font-bold text-xl">{busNumber}</p>
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Bus className="w-4 h-4" /> Bus Details
              </label>
              <p className="text-xl font-semibold text-gray-800">{busName}</p>
              <span className="text-sm text-gray-400">Bus No: {busNumber}</span>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Boarding Point
              </label>
              <p className="text-xl font-semibold text-gray-800">{stopName}</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4" /> Fee / Sem
              </label>
              <p className="text-xl font-semibold text-[#009689]">
                ₹{feeAmount?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CASE C: Payment (pendingBusRequest.status === 'approved' AND bus_service: false) ───
  if (student?.pendingBusRequest?.status === "approved" && !student?.bus_service) {
    const { busName, stopName, feeAmount } = student.pendingBusRequest;
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 p-6 text-white flex items-center gap-4">
            <div className="bg-emerald-500/30 w-14 h-14 rounded-full flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Request Approved!</h1>
              <p className="opacity-90 text-sm">Complete the payment to activate your bus pass</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-emerald-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Payment Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-2"><Bus className="w-4 h-4" /> Bus Route</span>
                  <span className="font-medium text-gray-900">{busName}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Boarding Point</span>
                  <span className="font-medium text-gray-900">{stopName}</span>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Amount Due</span>
                  <span className="text-3xl font-bold text-emerald-600">₹{feeAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm">Payment Instructions</p>
                <p className="text-amber-700 text-sm mt-1">
                  Please pay the bus fee at the college accounts office. Your bus pass will be activated
                  once the payment is verified by the administration.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-emerald-200 text-emerald-700 font-medium text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Status: APPROVED — Awaiting Payment
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CASE B: Review (pendingBusRequest.status === 'pending') ───
  if (student?.pendingBusRequest?.status === "pending") {
    const { busName, stopName } = student.pendingBusRequest;
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center space-y-4">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Request Pending</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            You have requested for <strong>{busName}</strong> at <strong>{stopName}</strong>.
            Your application is currently under review by the college administration.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-yellow-200 text-yellow-700 font-medium text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            Status: PENDING
          </div>
        </div>
      </div>
    );
  }

  // ─── CASE A: Enrollment Form (no active request AND bus_service: false) ───
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#009689]">Avail College Bus Facility</h2>
            <p className="text-gray-500 mt-1">Select your preferred route and stop to request bus service.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Side */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Bus Route</label>
                <ConfigProvider theme={{
                  token: { colorPrimary: '#009689' }
                }}>
                  <Select
                    className="w-full h-12"
                    placeholder="Choose a bus route"
                    options={buses.map(b => ({ value: b.id, label: `${b.busNumber} - ${b.busName}` }))}
                    onChange={handleBusChange}
                    value={selectedBus}
                  />
                </ConfigProvider>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Boarding Point</label>
                <ConfigProvider theme={{
                  token: { colorPrimary: '#009689' }
                }}>
                  <Select
                    className="w-full h-12"
                    placeholder={selectedBus ? "Choose your stop" : "Select a bus first"}
                    disabled={!selectedBus}
                    options={availableStops.map(s => ({ value: s.id, label: s.stopName }))}
                    onChange={handleStopChange}
                    value={selectedStop}
                  />
                </ConfigProvider>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedBus || !selectedStop || submitting}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all
                            ${(!selectedBus || !selectedStop || submitting)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#009689] hover:bg-[#007f74] shadow-lg shadow-teal-700/20 active:scale-[0.98]'
                  }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </span>
                ) : "Submit Request"}
              </button>
            </div>

            {/* Preview Side */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
              {activeBus && selectedStop ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Fee Preview</h3>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Bus Route</span>
                    <span className="font-medium text-gray-900">{activeBus.busNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Stop Name</span>
                    <span className="font-medium text-gray-900">
                      {availableStops.find(s => s.id === selectedStop)?.stopName}
                    </span>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-gray-600">Semester Fee</span>
                    <span className="text-2xl font-bold text-[#009689]">
                      ₹{feePreview?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Select a route and stop to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusServiceManager;