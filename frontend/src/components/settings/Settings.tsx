import React, { useState, useEffect } from "react";
import { admissionService } from "../../services/admissionService";
import type { AdmissionWindow } from "../../types/admission";
import { Calendar, AlertCircle, CheckCircle2, X } from "lucide-react";
import SemesterTable from "./SemesterTable";

const Settings: React.FC = () => {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          System Settings
        </h1>
        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg animate-slide-in ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}
      </div>

      {/* No Due Request Toggle */}
      <div>{/* Removed No Due Request Toggle - Moved to Due Management */}</div>

      {/* System Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4 transition-all hover:shadow-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Applications Per Day
          </label>
          <input
            type="number"
            defaultValue={100}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="100"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emailNotif"
            className="rounded transition-all"
            defaultChecked
          />
          <label htmlFor="emailNotif" className="text-sm text-gray-700">
            Enable Email Notifications for status changes
          </label>
        </div>
        <button className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium transition-all transform hover:scale-105">
          Save Configuration
        </button>
      </div>

      <div className="min-h-screen w-full">
        <SemesterTable />
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slide-in { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Settings;
