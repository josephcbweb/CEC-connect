import React, { useState, useEffect } from "react";
import { admissionService } from "../../services/admissionService";
import type { AdmissionWindow } from "../../types/admission";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

// Reusable toggle with confirm dialog
const ToggleWithConfirm: React.FC<{
  label: string;
  helper: string;
  value: boolean;
  onChange: (next: boolean) => void;
  loading?: boolean;
}> = ({ label, helper, value, onChange, loading }) => {
  const [pending, setPending] = useState<boolean | null>(null);

  const openConfirm = () => setPending(!value);
  const confirm = () => {
    if (pending !== null) onChange(pending);
    setPending(null);
  };
  const cancel = () => setPending(null);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-start justify-between gap-4 transition-all hover:shadow-md">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-600 mt-1">{helper}</div>
      </div>
      <button
        onClick={openConfirm}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-teal-600" : "bg-gray-300"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-pressed={value}
        aria-label={label}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>

      {pending !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-sm relative animate-scale-in">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={cancel}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Confirm change
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to {pending ? "enable" : "disable"} this
              setting?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancel}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                className="px-4 py-2 text-sm rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Settings: React.FC = () => {
  const [noDueRequestEnabled, setNoDueRequestEnabled] = useState(false);
  const [windows, setWindows] = useState<AdmissionWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWindow, setNewWindow] = useState({
    program: "btech",
    startDate: "",
    endDate: "",
    description: "",
  });

  // Helper function to check if admission window is currently open based on dates
  const isWindowOpen = (startDate: string, endDate: string): boolean => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchWindows();
  }, []);

  const fetchWindows = async () => {
    try {
      setLoading(true);
      const response = await admissionService.getAdmissionWindows();
      setWindows(response.data || []);
    } catch (error) {
      console.error("Error fetching admission windows:", error);
      showMessage("error", "Failed to load admission windows");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleWindowUpdate = async (
    id: number,
    data: Partial<AdmissionWindow>
  ) => {
    try {
      setSaving(true);
      await admissionService.updateAdmissionWindow(id, data);
      await fetchWindows();
      showMessage("success", "Admission window updated successfully");
    } catch (error) {
      console.error("Error updating window:", error);
      showMessage("error", "Failed to update admission window");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWindow = async () => {
    if (!newWindow.startDate || !newWindow.endDate) {
      showMessage("error", "Please fill in all required fields");
      return;
    }

    // Validate that end date is after start date
    const start = new Date(newWindow.startDate);
    const end = new Date(newWindow.endDate);
    if (end <= start) {
      showMessage("error", "End date must be after start date");
      return;
    }

    try {
      setSaving(true);
      // Calculate isOpen based on current date
      const isOpen = isWindowOpen(newWindow.startDate, newWindow.endDate);
      await admissionService.createAdmissionWindow({ ...newWindow, isOpen });
      await fetchWindows();
      showMessage("success", "Admission window created successfully");
      setShowCreateModal(false);
      setNewWindow({
        program: "btech",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (error: any) {
      console.error("Error creating window:", error);
      showMessage(
        "error",
        error.response?.data?.error || "Failed to create admission window"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWindow = async (window: AdmissionWindow) => {
    if (
      !confirm(
        `Are you sure you want to delete the ${window.program.toUpperCase()} admission window? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      await admissionService.deleteAdmissionWindow(window.id);
      await fetchWindows();
      showMessage("success", "Admission window deleted successfully");
    } catch (error) {
      console.error("Error deleting window:", error);
      showMessage("error", "Failed to delete admission window");
    } finally {
      setSaving(false);
    }
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
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          General Settings
        </h2>
        <ToggleWithConfirm
          label="Enable No Due Request"
          helper="This will enable the No Due Request button for the students and the relevant settings for the staff."
          value={noDueRequestEnabled}
          onChange={setNoDueRequestEnabled}
        />
      </div>

      {/* Admission Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Admission Management
          </h2>
          {!loading && windows.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium transition-all transform hover:scale-105"
            >
              + Add New Window
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading admission windows...</p>
          </div>
        ) : windows.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No admission windows configured
            </p>
            <p className="text-sm text-gray-400 mt-2 mb-4">
              Create an admission window to start managing applications
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium transition-all transform hover:scale-105"
            >
              Create Admission Window
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {windows.map((window, index) => (
              <div
                key={window.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 transition-all hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 uppercase flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        {window.program} Admissions
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {window.description ||
                          `Manage ${window.program.toUpperCase()} admission window`}
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isWindowOpen(window.startDate, window.endDate)
                          ? "bg-green-100 text-green-800 animate-pulse"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          isWindowOpen(window.startDate, window.endDate)
                            ? "bg-green-600"
                            : "bg-gray-600"
                        }`}
                      ></span>
                      {isWindowOpen(window.startDate, window.endDate)
                        ? "Open"
                        : "Closed"}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                    ℹ️ Status is automatically determined by the current date
                    and configured date range
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={window.startDate.split("T")[0]}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        const endDate = window.endDate.split("T")[0];
                        if (new Date(newStartDate) >= new Date(endDate)) {
                          showMessage(
                            "error",
                            "Start date must be before end date"
                          );
                          return;
                        }
                        handleWindowUpdate(window.id, {
                          startDate: newStartDate,
                        });
                      }}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={window.endDate.split("T")[0]}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        const startDate = window.startDate.split("T")[0];
                        if (new Date(newEndDate) <= new Date(startDate)) {
                          showMessage(
                            "error",
                            "End date must be after start date"
                          );
                          return;
                        }
                        handleWindowUpdate(window.id, {
                          endDate: newEndDate,
                        });
                      }}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (shown to students)
                  </label>
                  <textarea
                    value={window.description || ""}
                    onChange={(e) =>
                      handleWindowUpdate(window.id, {
                        description: e.target.value,
                      })
                    }
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                    rows={2}
                    placeholder={`${window.program.toUpperCase()} admissions for 2025-26 batch`}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    Last updated:{" "}
                    {new Date(window.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteWindow(window)}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Delete Window
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Configuration */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          System Configuration
        </h2>
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
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 to disable limit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-approve Rank Below
            </label>
            <input
              type="number"
              defaultValue={0}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 to disable auto-approval
            </p>
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
      </div>

      {/* Create Admission Window Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Admission Window
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  value={newWindow.program}
                  onChange={(e) =>
                    setNewWindow({ ...newWindow, program: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="btech">B.Tech</option>
                  <option value="mtech">M.Tech</option>
                  <option value="mca">MCA</option>
                  <option value="mba">MBA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newWindow.startDate}
                    onChange={(e) =>
                      setNewWindow({ ...newWindow, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newWindow.endDate}
                    min={newWindow.startDate}
                    onChange={(e) =>
                      setNewWindow({ ...newWindow, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newWindow.description}
                  onChange={(e) =>
                    setNewWindow({ ...newWindow, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description shown to students during admission"
                />
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                ℹ️ The admission window will automatically open/close based on
                the configured date range. Students can only submit applications
                when the current date falls within the start and end dates.
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWindow}
                disabled={saving}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? "Creating..." : "Create Window"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Settings;
