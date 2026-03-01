import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";

interface User {
  id: number;
  username: string;
}

interface ServiceDepartment {
  id: number;
  name: string;
  code: string;
  program: string;
  assignedUserId: number | null;
  assignedUser?: User;
}

interface DueConfig {
  id: number;
  semester: number;
  program: string;
  serviceDepartmentId: number | null;
  serviceDepartment?: ServiceDepartment;
  name: string | null;
  dueDate: string | null;
  isActive: boolean;
}

const DueSettingsPanel = () => {
  const [configs, setConfigs] = useState<DueConfig[]>([]);
  const [departments, setDepartments] = useState<ServiceDepartment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState("BTECH");
  const [selectedSemesterForAdd, setSelectedSemesterForAdd] = useState<
    number | null
  >(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDueData, setNewDueData] = useState({
    name: "",
    assignedUserId: "",
  });
  const [creatingDue, setCreatingDue] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<number | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editDeptData, setEditDeptData] = useState({
    name: "",
    assignedUserId: "",
  });
  const [updatingDept, setUpdatingDept] = useState(false);

  useEffect(() => {
    initData();
  }, [selectedProgram]);

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchDepartments(), fetchConfigs(false), fetchUsers()]);
    setLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `http://localhost:3000/settings/service-departments?program=${selectedProgram}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) setDepartments(await res.json());
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/settings/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchConfigs = async (shouldSetLoading = true) => {
    if (shouldSetLoading) setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/settings/due-configs?program=${selectedProgram}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        },
      );
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          semester,
          serviceDepartmentId: deptId,
          program: selectedProgram,
        }),
      });
      if (res.ok) {
        await fetchConfigs(false);
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      await fetchConfigs();
    } catch (error) {
      console.error("Failed to delete config", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateDue = async () => {
    if (!newDueData.name) return;
    setCreatingDue(true);
    try {
      const res = await fetch(
        "http://localhost:3000/settings/service-departments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            name: newDueData.name,
            program: selectedProgram,
            assignedUserId: newDueData.assignedUserId
              ? Number(newDueData.assignedUserId)
              : null,
          }),
        },
      );
      if (res.ok) {
        setNewDueData({ name: "", assignedUserId: "" });
        setShowCreateModal(false);
        fetchDepartments();
      }
    } catch (error) {
      console.error("Failed to create due", error);
    } finally {
      setCreatingDue(false);
    }
  };

  const handleUpdateDept = async (id: number) => {
    if (!editDeptData.name) return;
    setUpdatingDept(true);
    try {
      const res = await fetch(
        `http://localhost:3000/settings/service-departments/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            name: editDeptData.name,
            program: selectedProgram,
            assignedUserId: editDeptData.assignedUserId
              ? Number(editDeptData.assignedUserId)
              : null,
          }),
        },
      );
      if (res.ok) {
        setEditingDeptId(null);
        fetchDepartments();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update default due.");
      }
    } catch (error) {
      console.error("Failed to update due", error);
    } finally {
      setUpdatingDept(false);
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
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

      <div className="flex border-b border-slate-200 mb-6">
        {["BTECH", "MTECH", "MCA"].map((prog) => (
          <button
            key={prog}
            onClick={() => setSelectedProgram(prog)}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              selectedProgram === prog
                ? "text-emerald-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {prog === "BTECH" ? "B.Tech" : prog === "MTECH" ? "M.Tech" : "MCA"}
            {selectedProgram === prog && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 animate-in fade-in duration-300" />
            )}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300`}
      >
        {Array.from(
          { length: selectedProgram === "BTECH" ? 8 : 4 },
          (_, i) => i + 1,
        ).map((sem) => {
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-900">Manage Default Dues</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Default Due
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={`flex flex-col p-4 bg-slate-50 border rounded-xl transition-all ${
                editingDeptId === dept.id
                  ? "border-emerald-400 shadow-md ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-emerald-200 group"
              }`}
            >
              {editingDeptId === dept.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    value={editDeptData.name}
                    onChange={(e) =>
                      setEditDeptData({ ...editDeptData, name: e.target.value })
                    }
                    placeholder="Due Name"
                  />
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    value={editDeptData.assignedUserId}
                    onChange={(e) =>
                      setEditDeptData({
                        ...editDeptData,
                        assignedUserId: e.target.value,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingDeptId(null)}
                      className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-md transition-colors"
                      disabled={updatingDept}
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdateDept(dept.id)}
                      disabled={!editDeptData.name || updatingDept}
                      className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors disabled:opacity-50"
                    >
                      {updatingDept ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-medium">
                      {dept.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {dept.assignedUser
                        ? `Assigned to: ${dept.assignedUser.username}`
                        : "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingDeptId(dept.id);
                        setEditDeptData({
                          name: dept.name,
                          assignedUserId: dept.assignedUserId
                            ? String(dept.assignedUserId)
                            : "",
                        });
                      }}
                      className="text-slate-400 hover:text-emerald-600 p-1.5 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Edit Due"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept.id)}
                      disabled={deletingDeptId === dept.id}
                      className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete Due"
                    >
                      {deletingDeptId === dept.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {departments.length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
              No default dues found for {selectedProgram}.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Create New Default Due
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={creatingDue}
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Library Fees"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={newDueData.name}
                  onChange={(e) =>
                    setNewDueData({ ...newDueData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign Person
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={newDueData.assignedUserId}
                  onChange={(e) =>
                    setNewDueData({
                      ...newDueData,
                      assignedUserId: e.target.value,
                    })
                  }
                >
                  <option value="">Select User (Unassigned)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Program
                  </label>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">
                    {selectedProgram}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 text-sm font-medium">
                    Default
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
                disabled={creatingDue}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDue}
                disabled={!newDueData.name || creatingDue}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                {creatingDue ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Due"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
