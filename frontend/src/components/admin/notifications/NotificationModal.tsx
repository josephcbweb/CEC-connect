import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";
import {
  type Notification,
  notificationService,
} from "../../../services/notificationService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification?: Notification; // If provided, edit mode
}

export default function NotificationModal({
  isOpen,
  onClose,
  onSuccess,
  notification,
}: Props) {
  // @ts-ignore
  const [formData, setFormData] = useState<Partial<Notification>>({
    title: "",
    description: "",
    targetType: "ALL",
    targetValue: "",
    priority: "NORMAL",
    status: "draft",
    expiryDate: undefined,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced targeting selection states
  const [targetMode, setTargetMode] = useState<"ALL" | "CUSTOM">("ALL");
  const [customProgram, setCustomProgram] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [customSemester, setCustomSemester] = useState("");

  // Pre-fill states from notification if editing
  useEffect(() => {
    if (isOpen) {
      if (notification) {
        setFormData({ ...notification });
        if (notification.targetType === "ALL") {
          setTargetMode("ALL");
        } else {
          setTargetMode("CUSTOM");
          if (notification.targetType === "PROGRAM") {
            setCustomProgram(notification.targetValue || "");
          } else if (notification.targetType === "DEPARTMENT") {
            setCustomDept(notification.targetValue || "");
          } else if (notification.targetType === "SEMESTER") {
            setCustomSemester(notification.targetValue || "");
          } else if (notification.targetType === "CLASS") {
            try {
              const parsed = JSON.parse(notification.targetValue || "{}");
              if (parsed.program) setCustomProgram(parsed.program);
              if (parsed.department_code) setCustomDept(parsed.department_code);
              if (parsed.semester) setCustomSemester(`S${parsed.semester}`);
            } catch (e) {}
          }
        }
      } else {
        setFormData({
          title: "",
          description: "",
          targetType: "ALL",
          targetValue: "",
          priority: "NORMAL",
          status: "draft",
          expiryDate: undefined,
        });
        setTargetMode("ALL");
        setCustomProgram("");
        setCustomDept("");
        setCustomSemester("");
      }
      fetchDepartments();
    }
  }, [isOpen, notification]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:3000/api/departments", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (res.ok) setDepartments(await res.json());
    } catch (e) {
      console.error("Failed to fetch departments", e);
    }
  };

  const filteredDepartments = customProgram
    ? departments.filter((d) => d.program === customProgram)
    : departments;

  if (!isOpen) return null;

  const handleSubmit = async (
    e: React.FormEvent,
    status: "draft" | "published",
  ) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.title?.trim() || !formData.description?.trim()) {
      alert("Title and Description are required");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalTargetType = formData.targetType;
      let finalTargetValue = formData.targetValue;

      if (targetMode === "ALL") {
        finalTargetType = "ALL";
        finalTargetValue = "";
      } else {
        // Evaluate Custom Targets
        const selections = [customProgram, customDept, customSemester].filter(
          Boolean,
        );
        if (selections.length === 0) {
          finalTargetType = "ALL";
          finalTargetValue = "";
        } else if (selections.length === 1) {
          if (customProgram) {
            finalTargetType = "PROGRAM";
            finalTargetValue = customProgram;
          } else if (customDept) {
            finalTargetType = "DEPARTMENT";
            finalTargetValue = customDept;
          } else if (customSemester) {
            finalTargetType = "SEMESTER";
            finalTargetValue = customSemester;
          }
        } else {
          // More than 1 filter -> Use CLASS combo type
          finalTargetType = "CLASS";
          finalTargetValue = JSON.stringify({
            program: customProgram || undefined,
            department_code: customDept || undefined,
            semester: customSemester
              ? parseInt(customSemester.replace("S", ""))
              : undefined,
          });
        }
      }

      const payload = {
        ...formData,
        status,
        targetType: finalTargetType,
        targetValue: finalTargetValue,
      };

      // @ts-ignore
      if (notification && notification.id) {
        // @ts-ignore
        await notificationService.update(notification.id, payload);
      } else {
        await notificationService.create(payload as any);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save notification. check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            {notification ? "Edit Notification" : "Create Notification"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200 transition-all"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Notification Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200 min-h-[100px] transition-all"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed message..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200"
                value={targetMode}
                onChange={(e) =>
                  setTargetMode(e.target.value as "ALL" | "CUSTOM")
                }
              >
                <option value="ALL">All Students</option>
                <option value="CUSTOM">Specific Group / Class</option>
              </select>
            </div>
            {/* Empty space to align if not custom, or we can just let it flow */}
          </div>

          {targetMode === "CUSTOM" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200 bg-white"
                  value={customProgram}
                  onChange={(e) => {
                    setCustomProgram(e.target.value);
                    setCustomDept(""); // Reset department when program changes
                  }}
                >
                  <option value="">All Programs</option>
                  <option value="BTECH">B.Tech</option>
                  <option value="MTECH">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200 bg-white"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {filteredDepartments.map((d: any) => (
                    <option key={d.id} value={d.department_code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200 bg-white"
                  value={customSemester}
                  onChange={(e) => setCustomSemester(e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={`S${s}`}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200"
                value={formData.priority}
                // @ts-ignore
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none border-gray-200"
                value={
                  formData.expiryDate
                    ? new Date(formData.expiryDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e, "draft")}
            disabled={isSubmitting}
            className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </button>
          <button
            onClick={(e) => handleSubmit(e, "published")}
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSubmitting ? "Publishing..." : "Publish Notification"}
          </button>
        </div>
      </div>
    </div>
  );
}
