import React, { useEffect, useState } from "react";
import { admissionService } from "../../services/admissionService";
import type { AdmissionWindow } from "../../types/admission";


interface ToggleWithConfirmProps {
  label: string;
  helper: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleWithConfirm: React.FC<ToggleWithConfirmProps> = ({
  label,
  helper,
  value,
  onChange,
}) => {
  const [pending, setPending] = useState<boolean | null>(null);

  const openConfirm = () => setPending(!value);
  const confirm = () => {
    if (pending !== null) onChange(pending);
    setPending(null);
  };
  const cancel = () => setPending(null);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-600 mt-1">{helper}</div>
      </div>
      <button
        onClick={openConfirm}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-teal-600" : "bg-gray-300"
        }`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-sm relative">
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
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                className="px-4 py-2 text-sm rounded-md bg-teal-600 text-white hover:bg-teal-700"
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

const AdmissionSettings: React.FC = () => {
  const [noDueRequestEnabled, setNoDueRequestEnabled] = useState(false);
  const [windows, setWindows] = useState<AdmissionWindow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWindows();
  }, []);

  const fetchWindows = async () => {
    try {
      const response = await admissionService.getAdmissionWindows();
      setWindows(response.data || []);
    } catch (error) {
      console.error("Error fetching admission windows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWindowUpdate = async (
    id: number,
    data: Partial<AdmissionWindow>
  ) => {
    try {
      await admissionService.updateAdmissionWindow(id, data);
      fetchWindows();
      alert("Admission window updated successfully");
    } catch (error) {
      console.error("Error updating window:", error);
      alert("Failed to update admission window");
    }
  };

  const handleToggleWindow = (window: AdmissionWindow) => {
    if (
      !confirm(
        `Are you sure you want to ${
          window.isOpen ? "close" : "open"
        } ${window.program.toUpperCase()} admissions?`
      )
    ) {
      return;
    }
    handleWindowUpdate(window.id, { isOpen: !window.isOpen });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      {/* No Due Request Toggle */}
      <ToggleWithConfirm
        label="Enable No Due Request"
        helper="This will enable the No Due Request button for the students and the relevant settings for the staff as well."
        value={noDueRequestEnabled}
        onChange={setNoDueRequestEnabled}
      />

      {/* Admission Window Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Admission Window Management
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : windows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No admission windows configured.</p>
            <p className="text-sm mt-2">
              Please contact system administrator to set up admission windows.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {windows.map((window) => (
              <div
                key={window.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 uppercase">
                    {window.program} Admissions
                  </h3>
                  <button
                    onClick={() => handleToggleWindow(window)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      window.isOpen
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {window.isOpen ? "Close Admissions" : "Open Admissions"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={window.startDate.split("T")[0]}
                      onChange={(e) =>
                        handleWindowUpdate(window.id, {
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={window.endDate.split("T")[0]}
                      onChange={(e) =>
                        handleWindowUpdate(window.id, {
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={window.description || ""}
                    onChange={(e) =>
                      handleWindowUpdate(window.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder={`${window.program.toUpperCase()} admissions for 2025-26 batch`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      window.isOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Status: {window.isOpen ? "Open" : "Closed"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Applications Per Day
            </label>
            <input
              type="number"
              defaultValue={100}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
              placeholder="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 to disable limit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto-approve Rank Below
            </label>
            <input
              type="number"
              defaultValue={0}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
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
              className="rounded"
              defaultChecked
            />
            <label htmlFor="emailNotif" className="text-sm text-gray-700">
              Enable Email Notifications
            </label>
          </div>

          <button className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium">
            Save Configuration
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default AdmissionSettings;
