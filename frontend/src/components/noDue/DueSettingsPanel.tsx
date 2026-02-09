import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, AlertCircle, Loader2 } from "lucide-react";

interface ServiceDepartment {
  id: number;
  name: string;
  code: string;
}

// Reusable toggle with confirm dialog
const ToggleWithConfirm: React.FC<{
  label: string;
  helper: string;
  value: boolean;
  onChange: (next: boolean) => void;
  loading?: boolean;
  confirmMessage?: string;
}> = ({ label, helper, value, onChange, loading, confirmMessage }) => {
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
            <div className="mb-4">
              {confirmMessage ? (
                <div className="rounded-md bg-amber-50 p-3 mb-2 flex gap-2 text-amber-800 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{confirmMessage}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  Are you sure you want to {pending ? "enable" : "disable"} this
                  setting?
                </p>
              )}
            </div>
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

interface DueConfig {
  id: number;
  semester: number;
  serviceDepartmentId: number | null;
  serviceDepartment?: ServiceDepartment;
  name: string | null;
  dueDate: string | null;
  isActive: boolean;
}

const DueSettingsPanel = () => {
  const [configs, setConfigs] = useState<DueConfig[]>([]);
  const [departments, setDepartments] = useState<ServiceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDueRequestEnabled, setNoDueRequestEnabled] = useState(false);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [newDeptName, setNewDeptName] = useState("");
  const [selectedSemesterForAdd, setSelectedSemesterForAdd] = useState<
    number | null
  >(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creatingDept, setCreatingDept] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<number | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDepartments(),
        fetchConfigs(false),
        fetchSystemSettings(),
        fetchActiveRequestCount(),
      ]);
      setLoading(false);
    };
    initData();
  }, []);

  const fetchActiveRequestCount = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/settings/active-requests-count",
      );
      if (res.ok) {
        const data = await res.json();
        setActiveRequestCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch active requests count", error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("http://localhost:3000/settings");
      if (res.ok) {
        const data = await res.json();
        const noDueSetting = data.find(
          (s: any) => s.key === "noDueRequestEnabled",
        );
        if (noDueSetting) setNoDueRequestEnabled(noDueSetting.enabled);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const handleToggleNoDue = async (value: boolean) => {
    try {
      const res = await fetch("http://localhost:3000/settings/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "noDueRequestEnabled", value }),
      });
      if (res.ok) {
        setNoDueRequestEnabled(value);
        // Refresh active count as disabling might archive requests
        fetchActiveRequestCount();
      }
    } catch (error) {
      console.error("Failed to toggle setting", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/settings/service-departments",
      );
      if (res.ok) setDepartments(await res.json());
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const fetchConfigs = async (shouldSetLoading = true) => {
    if (shouldSetLoading) setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/settings/due-configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Failed to fetch configs", error);
    } finally {
      if (shouldSetLoading) setLoading(false);
    }
  };

  const handleAddConfig = async (deptId: number, semester: number) => {
    setAddingId(deptId);
    try {
      const res = await fetch("http://localhost:3000/settings/due-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semester,
          serviceDepartmentId: deptId,
        }),
      });
      if (res.ok) {
        await fetchConfigs();
        setSelectedSemesterForAdd(null);
      }
    } catch (error) {
      console.error("Failed to add config", error);
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`http://localhost:3000/settings/due-configs/${id}`, {
        method: "DELETE",
      });
      await fetchConfigs();
    } catch (error) {
      console.error("Failed to delete config", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateDept = async () => {
    if (!newDeptName) return;
    setCreatingDept(true);
    try {
      const res = await fetch(
        "http://localhost:3000/settings/service-departments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newDeptName,
            code: newDeptName.toUpperCase().slice(0, 3),
          }),
        },
      );
      if (res.ok) {
        setNewDeptName("");
        fetchDepartments();
      }
    } catch (error) {
      console.error("Failed to create department", error);
    } finally {
      setCreatingDept(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure? This will fail if the fee type is currently in use.",
      )
    )
      return;
    setDeletingDeptId(id);
    try {
      const res = await fetch(
        `http://localhost:3000/settings/service-departments/${id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        fetchDepartments();
      } else {
        alert("Failed to delete. It might be in use.");
      }
    } catch (error) {
      console.error("Failed to delete department", error);
    } finally {
      setDeletingDeptId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Due Configuration</h2>
        <p className="text-slate-500">
          Configure automatic dues for each semester.
        </p>
      </div>

      <div className="mb-6">
        <ToggleWithConfirm
          label="Enable No Due Request"
          helper="This will allow students to initiate No Due requests. Turn off to disable new requests."
          value={noDueRequestEnabled}
          onChange={handleToggleNoDue}
          confirmMessage={
            noDueRequestEnabled && activeRequestCount > 0
              ? `Warning: There are ${activeRequestCount} active no-due requests. Disabling this will archive them and stop the process for these students.`
              : undefined
          }
        />
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300`}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
          const semConfigs = configs.filter((c) => c.semester === sem);
          return (
            <div
              key={sem}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">Semester {sem}</h3>
                <button
                  onClick={() => setSelectedSemesterForAdd(sem)}
                  className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors"
                  title="Add Due"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-2 flex-1">
                {semConfigs.length === 0 && (
                  <p className="text-slate-400 text-xs italic">
                    No dues configured
                  </p>
                )}
                {semConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm border border-slate-100"
                  >
                    <span className="text-slate-700 font-medium">
                      {config.serviceDepartment?.name || config.name}
                    </span>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      disabled={deletingId === config.id}
                      className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {deletingId === config.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Common Dues Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
        <h3 className="font-semibold text-slate-900 mb-4">Manage Fee Types</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <span className="text-slate-700">{dept.name}</span>
                <button
                  onClick={() => handleDeleteDept(dept.id)}
                  disabled={deletingDeptId === dept.id}
                  className="text-slate-400 hover:text-red-500 p-1 disabled:opacity-50"
                  title="Delete Fee Type"
                >
                  {deletingDeptId === dept.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">
              Create New Fee Type
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PTA Fee"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
              <button
                onClick={handleCreateDept}
                disabled={!newDeptName || creatingDept}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creatingDept ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {selectedSemesterForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Add Due to Semester {selectedSemesterForAdd}
              </h3>
              <button
                onClick={() => setSelectedSemesterForAdd(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {departments
                .filter(
                  (d) =>
                    !configs.find(
                      (c) =>
                        c.semester === selectedSemesterForAdd &&
                        c.serviceDepartmentId === d.id,
                    ),
                )
                .map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() =>
                      handleAddConfig(dept.id, selectedSemesterForAdd)
                    }
                    disabled={addingId === dept.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 rounded-lg group transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-slate-700 group-hover:text-emerald-700 font-medium">
                      {dept.name}
                    </span>
                    {addingId === dept.id ? (
                      <Loader2
                        size={16}
                        className="text-emerald-600 animate-spin"
                      />
                    ) : (
                      <Plus
                        size={16}
                        className="text-slate-300 group-hover:text-emerald-600"
                      />
                    )}
                  </button>
                ))}
              {departments.length === 0 && (
                <p className="text-center text-slate-500 py-4">
                  No fee types available. Create one below first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueSettingsPanel;
