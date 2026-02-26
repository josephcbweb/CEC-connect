import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface StudentEditable {
  id: number;
  email?: string;
  phone: string;
  permanentAddress: string;
  contactAddress: string;
  fatherPhone?: string;
  motherPhone?: string;
  guardianAddress?: string;
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: StudentEditable;
}

const baseURL = "http://localhost:3000";

const Input = ({
  label,
  name,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  name: string;
  value?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  textarea?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {textarea ? (
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    ) : (
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    )}
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
      {title}
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const EditStudentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const [formData, setFormData] = useState<StudentEditable>(student);

  useEffect(() => {
    if (isOpen) setFormData(student);
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const res = await fetch(`${baseURL}/students/update/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Edit Profile
          </h3>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-8">

          <Section title="Contact Information">
            <Input label="Email" name="email" value={formData.email} onChange={handleChange} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            <Input label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} textarea />
            <Input label="Contact Address" name="contactAddress" value={formData.contactAddress} onChange={handleChange} textarea />
          </Section>

          <Section title="Family Details">
            <Input label="Father's Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} />
            <Input label="Mother's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleChange} />
            <Input label="Guardian Address" name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} textarea />
          </Section>

          <Section title="Bank Details">
            <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
            <Input label="Bank Branch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} />
          </Section>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
