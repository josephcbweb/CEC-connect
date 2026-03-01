import { useState, useEffect } from "react";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Loader2,
  Calendar,
  Users,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

interface BatchDepartment {
  id: number;
  department: {
    id: number;
    name: string;
    department_code: string;
  };
  classes: any[];
}

interface Batch {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  status: "UPCOMING" | "ACTIVE" | "GRADUATED";
  batchDepartments: BatchDepartment[];
  departmentCount: number;
  classCount: number;
  admissionWindow: {
    program: "BTECH" | "MCA" | "MTECH";
  } | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const BatchRegistry = () => {
  usePageTitle("Manage Classes");
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/batches`);
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      UPCOMING: "bg-amber-50 text-amber-700 border-amber-200",
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
      GRADUATED: "bg-slate-50 text-slate-600 border-slate-200",
    };
    return styles[status] || styles.GRADUATED;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Manage Classes
        </h1>
        <p className="text-slate-500 text-sm">
          Manage academic batches and their class structures
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-sm font-medium mb-1">
                Total Batches
              </div>
              <div className="text-2xl font-semibold text-slate-900">
                {batches.length}
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-sm font-medium mb-1">
                Active Batches
              </div>
              <div className="text-2xl font-semibold text-slate-900">
                {batches.filter((b) => b.status === "ACTIVE").length}
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-sm font-medium mb-1">
                Total Classes
              </div>
              <div className="text-2xl font-semibold text-slate-900">
                {batches.reduce((acc, b) => acc + b.classCount, 0)}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Cards Grid */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-900 mb-1">
            No Batches Found
          </h3>
          <p className="text-slate-500 text-sm">
            Create a batch through the Admissions module to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => navigate(`/admin/batches/${batch.id}`)}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {batch.name}
                    </h3>
                    {batch.admissionWindow?.program && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-200 uppercase">
                        {batch.admissionWindow.program}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(
                      batch.status,
                    )}`}
                  >
                    {batch.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {batch.startYear} - {batch.endYear}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4">
                {/* Stats Row */}
                <div className="flex items-center gap-8 mb-4">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">
                      {batch.departmentCount}
                    </div>
                    <div className="text-xs text-slate-500">Departments</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-900">
                      {batch.classCount}
                    </div>
                    <div className="text-xs text-slate-500">Classes</div>
                  </div>
                </div>

                {/* Departments Preview */}
                {batch.batchDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {batch.batchDepartments.slice(0, 4).map((bd) => (
                      <span
                        key={bd.id}
                        className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded border border-slate-200"
                      >
                        {bd.department.department_code}
                      </span>
                    ))}
                    {batch.batchDepartments.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded border border-slate-200">
                        +{batch.batchDepartments.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Configure classes
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchRegistry;
