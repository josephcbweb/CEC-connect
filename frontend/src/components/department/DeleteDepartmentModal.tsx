import { X, AlertTriangle, ShieldAlert } from "lucide-react";

interface Props {
  isOpen: boolean;
  departmentName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  blocked?: { studentCount: number } | null;
}

export default function DeleteConfirmModal({
  isOpen,
  departmentName,
  loading,
  onClose,
  onConfirm,
  blocked,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${blocked ? 'bg-amber-100' : 'bg-red-100'}`}>
              {blocked ? (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {blocked ? "Deletion Blocked" : "Confirm Delete"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {blocked ? (
            <p className="text-gray-600 leading-relaxed">
              The department <span className="font-semibold text-gray-900">{departmentName}</span> cannot be deleted because it has{" "}
              <span className="font-semibold text-gray-900">{blocked.studentCount}</span> enrolled student(s).
              Please transfer or vacate these students before deleting the department.
            </p>
          ) : (
            <p className="text-gray-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{departmentName}</span>?
              This action cannot be undone.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            {blocked ? (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 px-4 font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl py-3 px-4 font-medium hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
