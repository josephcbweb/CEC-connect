import { useState } from "react";
import { X, Bus, Hash, MapPin, Users, User, Phone, FileText } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBusModal({ isOpen, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    busNumber: "",
    busName: "",
    routeName: "",
    totalSeats: "",
    driverName: "",
    driverPhone: "",
    registrationNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validation
    if (!formData.busNumber || !formData.totalSeats || !formData.driverName || !formData.driverPhone) {
      setError("Please fill in all required fields");
      return;
    }

    if (Number(formData.totalSeats) <= 0) {
      setError("Total seats must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/bus/addbus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalSeats: Number(formData.totalSeats),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({
          busNumber: "",
          busName: "",
          routeName: "",
          totalSeats: "",
          driverName: "",
          driverPhone: "",
          registrationNo: "",
        });
        setError("");
      } else {
        setError(data.message || "Failed to add bus");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(""); // Clear error on input change
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Bus</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Bus Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Bus Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bus Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Bus Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <input
                    placeholder="e.g.,001"
                    value={formData.busNumber}
                    onChange={(e) => handleChange("busNumber", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Bus Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Bus Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Bus className="w-5 h-5" />
                  </div>
                  <input
                    placeholder="e.g., Express Line A"
                    value={formData.busName}
                    onChange={(e) => handleChange("busName", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Route Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Route Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    placeholder="e.g., City Center - Airport"
                    value={formData.routeName}
                    onChange={(e) => handleChange("routeName", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Total Seats */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Total Seats <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    placeholder="e.g., 45"
                    value={formData.totalSeats}
                    onChange={(e) => handleChange("totalSeats", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Registration Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <input
                    placeholder="e.g., KL-07-AB-1234"
                    value={formData.registrationNo}
                    onChange={(e) => handleChange("registrationNo", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Driver Information Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Driver Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driver Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Driver Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    placeholder="e.g., John Doe"
                    value={formData.driverName}
                    onChange={(e) => handleChange("driverName", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Driver Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">
                  Driver Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g., +91 9876543210"
                    value={formData.driverPhone}
                    onChange={(e) => handleChange("driverPhone", e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding Bus...
                </span>
              ) : (
                "Add Bus"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}