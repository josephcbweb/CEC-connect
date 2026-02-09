import React, { useState, useEffect } from "react";
import { admissionService } from "../../../services/admissionService";
import type { AdmissionWindow } from "../../../types/admission";
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  ArrowLeft,
  Info,
} from "lucide-react";

interface Department {
  id: number;
  name: string;
}

type ViewState = "list" | "create";

const AdmissionWindowSettings: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>("list");
  const [windows, setWindows] = useState<AdmissionWindow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    program: "btech",
    startDate: "",
    endDate: "",
    description: "",
    batchName: "",
    startYear: new Date().getFullYear().toString(),
    endYear: (new Date().getFullYear() + 4).toString(),
    departmentIds: [] as number[],
  });

  // --- Effects ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- Helpers ---
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const isWindowOpen = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  // --- API ---
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [windowsRes, departmentsRes] = await Promise.all([
        admissionService.getAdmissionWindows(),
        fetch("http://localhost:3000/api/departments").then((r) =>
          r.ok ? r.json() : [],
        ),
      ]);
      setWindows(windowsRes.data || []);
      setDepartments(departmentsRes || []);
    } catch (error) {
      console.error("Failed to load data", error);
      showMessage("error", "Failed to load admission data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      setSaving(true);
      await admissionService.deleteAdmissionWindow(id);
      await fetchInitialData(); // Refresh list
      showMessage("success", "Window deleted");
    } catch (error) {
      showMessage("error", "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.batchName ||
      formData.departmentIds.length === 0
    ) {
      showMessage("error", "Please fill all required fields");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      showMessage("error", "End date must be after start date");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startYear: parseInt(formData.startYear),
        endYear: parseInt(formData.endYear),
        isOpen: isWindowOpen(formData.startDate, formData.endDate),
      };
      await admissionService.createAdmissionWindow(payload);
      await fetchInitialData();
      showMessage("success", "Window created successfully");
      setView("list");
      // Reset form
      setFormData({
        program: "btech",
        startDate: "",
        endDate: "",
        description: "",
        batchName: "",
        startYear: new Date().getFullYear().toString(),
        endYear: (new Date().getFullYear() + 4).toString(),
        departmentIds: [],
      });
    } catch (error: any) {
      showMessage(
        "error",
        error.response?.data?.error || "Failed to create window",
      );
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {message && (
        <div
          className={`rounded-lg p-4 flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* --- View: Create Form --- */}
      {view === "create" && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Create New Window
            </h3>
            <button
              onClick={() => setView("list")}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
          </div>

          <div className="space-y-6">
            {/* Batch & Program */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name (e.g. 2024-2028)
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.batchName}
                  onChange={(e) =>
                    setFormData({ ...formData, batchName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.program}
                  onChange={(e) =>
                    setFormData({ ...formData, program: e.target.value })
                  }
                >
                  <option value="btech">B.Tech</option>
                  <option value="mtech">M.Tech</option>
                  <option value="mca">MCA</option>
                  <option value="mba">MBA</option>
                </select>
              </div>
            </div>

            {/* Years */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Year
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.startYear}
                  onChange={(e) =>
                    setFormData({ ...formData, startYear: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Year
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.endYear}
                  onChange={(e) =>
                    setFormData({ ...formData, endYear: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Departments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Departments
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <label
                    key={dept.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.departmentIds.includes(dept.id)
                        ? "bg-teal-50 border-teal-200 text-teal-800"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded text-teal-600 focus:ring-teal-500 mr-3"
                      checked={formData.departmentIds.includes(dept.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...formData.departmentIds, dept.id]
                          : formData.departmentIds.filter((d) => d !== dept.id);
                        setFormData({ ...formData, departmentIds: ids });
                      }}
                    />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Window Opens
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Window Closes
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md flex gap-3 text-blue-800 text-sm">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p>
                The window will automatically be marked 'Open' if the current
                date is within the range.
              </p>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t">
              <button
                onClick={() => setView("list")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- View: List --- */}
      {view === "list" && (
        <div className="animate-in slide-in-from-left-4 duration-300">
          {windows.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">
                No Admission Windows
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first admission window.
              </p>
              <button
                onClick={() => setView("create")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Window
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setView("create")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Window
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {windows.map((w) => {
                  const isOpen = isWindowOpen(w.startDate, w.endDate);
                  return (
                    <div
                      key={w.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">
                            {w.program.toUpperCase()}
                          </h4>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {w.batch?.startYear}-{w.batch?.endYear}
                          </span>
                        </div>
                        <div
                          className={`flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                            isOpen
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mr-1.5 ${
                              isOpen ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {isOpen ? "Active" : "Closed"}
                        </div>
                      </div>

                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium min-w-[3rem]">
                            Batch:
                          </span>
                          <span>{w.batch?.name || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-xs text-gray-400 block">
                              Start
                            </span>
                            <span className="font-medium">
                              {new Date(w.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="h-px w-8 bg-gray-300"></div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">
                              End
                            </span>
                            <span className="font-medium">
                              {new Date(w.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Inline Edit for Dates */}
                        <div className="pt-2 border-t mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-gray-400">
                            {w.batch?.id ? `Batch ID: ${w.batch.id}` : ""}
                          </span>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                            title="Delete Window"
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdmissionWindowSettings;
