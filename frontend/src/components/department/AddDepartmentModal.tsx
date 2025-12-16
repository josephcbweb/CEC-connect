import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({ name: "", code: "" });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return;

    const res = await fetch("http://localhost:3000/department/alldepartments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      onSuccess();
      onClose();
      setFormData({ name: "", code: "" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
        <div className="flex justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Department</h2>
          <button onClick={onClose} className="hover:cursor-pointer">
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            placeholder="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <input
            placeholder="Department Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border rounded-lg py-2 hover:cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
