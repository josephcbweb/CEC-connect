import React, { useState } from "react";

// Reusable toggle with confirm dialog
const ToggleWithConfirm: React.FC<{
  label: string;
  helper: string;
  value: boolean;
  onChange: (next: boolean) => void;
}> = ({ label, helper, value, onChange }) => {
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

const Settings: React.FC = () => {
  const [semRegistrationEnabled, setSemRegistrationEnabled] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>

      <ToggleWithConfirm
        label="Enable No Due Request"
        helper="This will enable the No Due Request button for the students and the relevant settings for the staff."
        value={semRegistrationEnabled}
        onChange={setSemRegistrationEnabled}
      />
    </div>
  );
};

export default Settings;
