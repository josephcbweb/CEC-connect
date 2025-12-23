import React, { useEffect, useState } from "react";
import DepartmentTable from "./DepartmentTable";
import AddDepartmentModal from "./AddDepartmentModal";
import DepartmentControls from "./DepartmentControls";
import DeleteConfirmModal from "./DeleteDepartmentModal";
export interface Department {
  id: number;
  name: string;
  department_code: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function DepartmentDashboard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:3000/department/alldepartments"
      );
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (dept: Department) => {
    setSelectedDept(dept);
    setDeleteModalOpen(true);
  };
  const confirmDeleteDepartment = async () => {
    if (!selectedDept) return;

    try {
      setDeleteLoading(true);
      await fetch(`http://localhost:3000/department/${selectedDept.id}`, {
        method: "DELETE",
      });
      fetchDepartments();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setSelectedDept(null);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmDelete) return;
    try {
      const res = await fetch(`http://localhost:3000/department/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      fetchDepartments(); // refresh table
    } catch (error) {
      console.error(error);
      alert("Failed to delete department");
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.department_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Departments</h1>
          <p className="text-gray-600">
            Manage your organization's departments
          </p>
        </div>

        <DepartmentControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddClick={() => setIsModalOpen(true)}
        />

        <DepartmentTable
          departments={filteredDepartments}
          loading={loading}
          onDelete={handleDeleteClick}
        />
      </div>

      <AddDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDepartments}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        departmentName={selectedDept?.name || ""}
        loading={deleteLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteDepartment}
      />
    </div>
  );
}
