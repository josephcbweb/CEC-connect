import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Zap,
  Clock,
  CircleDot,
  FileText,
  ChevronDown,
  Settings,
} from "lucide-react";
import axios from "axios";
import AssignBusFeeModal from "./AssignBusFeeModal";
import BusFineSettingsModal from "./BusFineSettingsModal";

interface StudentRow {
  studentId: number;
  name: string;
  admissionNumber: string;
  batchName: string;
  stopName: string;
  feeAmount: number;
  status: "not_billed" | "unpaid" | "paid" | "overdue";
  invoiceId: number | null;
  invoiceAmount: number | null;
  dueDate: string | null;
}

interface Counts {
  total: number;
  notBilled: number;
  unpaid: number;
  paid: number;
}

const statusConfig = {
  not_billed: {
    label: "Not Billed",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  unpaid: {
    label: "Unpaid",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  paid: {
    label: "Paid",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  setup_incomplete: {
    label: "Missing Setup",
    bg: "bg-red-50 border border-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  }
};

interface ActiveGroup {
  program: string;
  semester: number;
}

const BusFeeManager = () => {
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, notBilled: 0, unpaid: 0, paid: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<StudentRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load active groups on mount
  useEffect(() => {
    axios
      .get("http://localhost:3000/bus/active-semesters")
      .then((res) => {
        setActiveGroups(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Update available semesters when program changes
  useEffect(() => {
    if (selectedProgram === "all") {
      // Get unique semesters across all programs
      const uniqueSems = Array.from(new Set(activeGroups.map(g => g.semester))).sort((a, b) => a - b);
      setAvailableSemesters(uniqueSems);
    } else {
      const sems = activeGroups
        .filter(g => g.program === selectedProgram)
        .map(g => g.semester)
        .sort((a, b) => a - b);
      setAvailableSemesters(sems);

      // Auto-select first available semester if current selection is invalid
      if (selectedSemester !== "all" && !sems.includes(parseInt(selectedSemester))) {
        setSelectedSemester(sems.length > 0 ? sems[0].toString() : "all");
      }
    }
  }, [selectedProgram, activeGroups]);

  // Fetch semester status
  const fetchSemesterStatus = async (program: string, sem: string) => {
    if (!sem) return;
    setLoading(true);
    try {
      let url = `http://localhost:3000/bus/semester-status?semester=${sem}`;
      if (program !== "all") {
        url += `&program=${program}`;
      }

      const res = await axios.get(url);
      setStudents(res.data.students);
      setCounts(res.data.counts);
    } catch (error) {
      console.error("Error fetching semester status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemester) {
      fetchSemesterStatus(selectedProgram, selectedSemester);
    }
  }, [selectedProgram, selectedSemester]);

  const handleVerifyPaymentClick = (student: StudentRow) => {
    setTargetStudent(student);
    setIsConfirmModalOpen(true);
  };

  const confirmPaymentUpdate = async () => {
    if (!targetStudent?.invoiceId) return;
    setIsUpdating(true);
    try {
      const response = await axios.patch(
        `http://localhost:3000/bus/update-payment-status/${targetStudent.invoiceId}`,
        { status: "paid" }
      );
      if (response.status === 200) {
        await fetchSemesterStatus(selectedProgram, selectedSemester);
        setIsConfirmModalOpen(false);
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || "Server connection failed"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filters
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter ||
      (statusFilter === "unpaid" && s.status === "overdue");
    return matchesSearch && matchesStatus;
  });

  // ── Main view ──
  return (
    <div className="p-6 animate-in fade-in duration-500">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Bus Fee Manager</h3>
            <p className="text-sm text-gray-500">Semester-wide billing overview</p>
          </div>
          <div className="flex gap-2">
            {/* Program Dropdown */}
            <div className="relative">
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="pl-4 pr-8 py-2 bg-violet-50 border border-violet-100 rounded-xl text-[#4134bd] font-bold text-sm focus:ring-2 focus:ring-[#4134bd] outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Programs</option>
                {Array.from(new Set(activeGroups.map(g => g.program))).map((prog) => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4134bd] pointer-events-none" />
            </div>

            {/* Semester Dropdown */}
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="pl-4 pr-8 py-2 bg-violet-50 border border-violet-100 rounded-xl text-[#4134bd] font-bold text-sm focus:ring-2 focus:ring-[#4134bd] outline-none appearance-none cursor-pointer min-w-[130px]"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4134bd] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            disabled={counts.notBilled === 0 || selectedSemester === "all" || selectedProgram === "all"}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-6 bg-[#4134bd] text-white font-semibold rounded-xl hover:bg-[#3529a3] hover:shadow-lg transition-all active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            title={(selectedSemester === "all" || selectedProgram === "all") ? "Select a specific program and semester to assign bulk fees" : ""}
          >
            <Zap className="w-4 h-4" />
            {counts.notBilled > 0
              ? `Run Bulk Billing (${counts.notBilled})`
              : "All Students Billed"}
          </button>
        </div>
      </div>

      {/* Smart Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] rounded-2xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{counts.total}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bus Users</p>
            </div>
          </div>
          <div
            className={`border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${statusFilter === "not_billed" ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-gray-100 hover:border-amber-100"}`}
            onClick={() => setStatusFilter(statusFilter === "not_billed" ? "all" : "not_billed")}
          >
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <CircleDot className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{counts.notBilled}</p>
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending Billing</p>
            </div>
          </div>
          <div
            className={`border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${statusFilter === "unpaid" ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-gray-100 hover:border-orange-100"}`}
            onClick={() => setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid")}
          >
            <div className="p-2.5 bg-orange-50 rounded-xl">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-orange-600">{counts.unpaid}</p>
              <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Awaiting Payment</p>
            </div>
          </div>
          <div
            className={`border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${statusFilter === "paid" ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-gray-100 hover:border-green-100"}`}
            onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}
          >
            <div className="p-2.5 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{counts.paid}</p>
              <p className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Payments Received</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or admission number..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4134bd]/20 focus:border-[#4134bd] transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {(searchTerm || statusFilter !== "all") && (
          <button
            onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Unified Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#4134bd] animate-spin" />
            <p className="text-gray-500 font-medium">Loading student data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b bg-gray-50/50">
                  <th className="py-3.5 pl-6">Student</th>
                  <th className="py-3.5">Batch</th>
                  <th className="py-3.5">Bus Stop</th>
                  <th className="py-3.5">Fee Amount</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((row) => {
                    const cfg = statusConfig[row.status];
                    return (
                      <tr key={row.studentId} className={`hover:bg-gray-50/50 transition-colors ${row.status === 'setup_incomplete' ? 'opacity-70' : ''}`}>
                        <td className="py-3.5 pl-6">
                          <p className="font-semibold text-gray-800 text-sm">{row.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.admissionNumber}</p>
                        </td>
                        <td className="py-3.5">
                          {row.status === 'setup_incomplete' && !row.batchName ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No Class</span>
                          ) : (
                            <span className="text-xs font-bold bg-violet-50 text-[#4134bd] px-2.5 py-1 rounded-lg">
                              {row.batchName}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-sm text-gray-600">
                          {row.status === 'setup_incomplete' && (!row.stopName || row.stopName === 'N/A') ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No Stop</span>
                          ) : (
                            row.stopName
                          )}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-sm text-gray-800">
                          ₹{Number(row.feeAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                            {row.status !== 'setup_incomplete' && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          {(row.status === "unpaid" || row.status === "overdue") && row.invoiceId && (
                            <button
                              onClick={() => handleVerifyPaymentClick(row)}
                              className="text-[#4134bd] hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold active:scale-95"
                            >
                              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                              Verify Payment
                            </button>
                          )}
                          {row.status === "paid" && row.dueDate && (
                            <span className="text-xs text-gray-400">
                              <FileText className="w-3.5 h-3.5 inline mr-1" />
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-gray-400">
                      {searchTerm || statusFilter !== "all"
                        ? "No students match your filters."
                        : "No bus-service students found for this semester."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {selectedProgram !== "all" && selectedSemester !== "all" && (
        <AssignBusFeeModal
          isOpen={isAssignModalOpen}
          program={selectedProgram}
          semester={selectedSemester}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => fetchSemesterStatus(selectedProgram, selectedSemester)}
        />
      )}

      {/* Settings Modal */}
      <BusFineSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Confirm Payment Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-[#4134bd]">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Verify Payment</h3>
              </div>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Mark the bus fee for <strong>{targetStudent?.name}</strong> (₹{Number(targetStudent?.invoiceAmount || targetStudent?.feeAmount).toLocaleString()}) as paid? This reflects a manual cash collection.
            </p>
            <div className="flex gap-3">
              <button
                disabled={isUpdating}
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={isUpdating}
                onClick={confirmPaymentUpdate}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-md flex justify-center items-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusFeeManager;