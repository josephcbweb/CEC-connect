import { useState, useEffect } from "react";
import {
  ReceiptIndianRupee,
  Users,
  Calendar,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Search,
  CheckCircle,
  Archive,
  X,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import AssignBusFeeModal from "./AssignBusFeeModal";

const BusFeeManager = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<any>(null);
  const [targetBatch, setTargetBatch] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get("http://localhost:3000/bus/fee-batches");
      setBatches(res.data);
    } catch (error) {
      console.error("Error fetching batches", error);
    }
  };

  const fetchBatchDetails = async (batch: any) => {
    if (!batch || !batch.dueDate) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/bus/batch-details`, {
        params: {
          semester: batch.semester,
          feeName: batch.feeName,
          dueDate: batch.dueDate,
        },
      });
      setBatchDetails(res.data);
    } catch (error) {
      console.error("Error fetching student details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaidClick = (invoice: any) => {
    setTargetInvoice(invoice);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveClick = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation(); 
    setTargetBatch(batch);
    setIsArchiveModalOpen(true);
  };

  const confirmPaymentUpdate = async () => {
    if (!targetInvoice) return;
    setIsUpdating(true);
    try {
      const response = await axios.patch(
        `http://localhost:3000/bus/update-payment-status/${targetInvoice.id}`,
        { status: "paid" }
      );
      if (response.status === 200) {
        await fetchBatchDetails(selectedBatch);
        setIsConfirmModalOpen(false);
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || "Server connection failed"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmArchive = async () => {
    if (!targetBatch) return;
    setIsUpdating(true);
    try {
      // Logic to update archived status in FeeDetails table
      await axios.patch("http://localhost:3000/bus/archive-batch", {
        feeName: targetBatch.feeName,
        semester: targetBatch.semester,
        dueDate: targetBatch.dueDate,
      });
      await fetchBatches();
      setIsArchiveModalOpen(false);
    } catch (error: any) {
      alert("Failed to archive the fee batch. Ensure all records match.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredDetails = batchDetails.filter((item) =>
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // VIEW 1: Grid of Fee History Cards
  if (!selectedBatch) {
    return (
      <div className="p-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Fee Assignment History</h3>
            <p className="text-sm text-gray-500">View and track bus fee collection status</p>
          </div>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 py-2.5 px-6 bg-[#4134bd] text-white font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <ReceiptIndianRupee className="w-5 h-5" /> Assign New Fee
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.length > 0 ? (
            batches.map((batch) => (
              <div
                key={`${batch.feeName}-${batch.semester}-${batch.dueDate}`}
                onClick={() => {
                  setSelectedBatch(batch);
                  fetchBatchDetails(batch);
                }}
                className="group relative bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-[#4134bd] transition-all cursor-pointer"
              >
                {/* Larger Archive Button */}
                <button
                  onClick={(e) => handleArchiveClick(e, batch)}
                  className="absolute top-3 right-3 p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 z-10 border border-transparent hover:border-red-100 shadow-sm"
                  title="Archive this batch"
                >
                  <Archive className="w-5 h-5" />
                </button>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-violet-50 rounded-xl text-[#4134bd]">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 mr-10">
                    Semester {batch.semester}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 group-hover:text-[#4134bd] transition-colors line-clamp-1 pr-8">
                  {batch.feeName}
                </h4>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(batch.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400">No active fee assignments found.</p>
            </div>
          )}
        </div>

        <AssignBusFeeModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={fetchBatches}
        />

        {/* Archive Confirmation Modal */}
        {isArchiveModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Archive Batch?</h3>
                </div>
                <button onClick={() => setIsArchiveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Archiving <strong>{targetBatch?.feeName}</strong> will hide it. You must archive the current batch before assigning new fees to Semester {targetBatch?.semester} students.
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isUpdating}
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isUpdating}
                  onClick={confirmArchive}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-md flex justify-center items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Archive Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Detailed Student List
  return (
    <div className="p-6 animate-in slide-in-from-right duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => { setSelectedBatch(null); setSearchTerm(""); }}
          className="flex items-center gap-2 text-gray-500 hover:text-[#4134bd] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to History
        </button>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search student name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4134bd]/20 focus:border-[#4134bd] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{selectedBatch.feeName}</h3>
            <p className="text-gray-500 text-sm italic">Semester {selectedBatch.semester} Records</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-center min-w-[100px]">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Students</p>
            <p className="text-xl font-black text-[#4134bd]">{batchDetails.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-[#4134bd] animate-spin" />
              <p className="text-gray-500 font-medium">Fetching records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b bg-gray-50/30">
                  <th className="py-4 pl-8">Student Name</th>
                  <th className="py-4">Bus Stop</th>
                  <th className="py-4">Amount</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDetails.length > 0 ? (
                  filteredDetails.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 pl-8 font-semibold text-gray-700">{row.student.name}</td>
                      <td className="py-4 text-gray-500">{row.student.busStop?.stopName || "N/A"}</td>
                      <td className="py-4 font-mono font-bold text-gray-900">₹{row.amount}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${
                          row.status === "paid" 
                            ? "bg-green-100 text-green-700" 
                            : row.status === "overdue" 
                            ? "bg-amber-100 text-amber-700 border border-amber-200" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 pr-8 text-right">
                        {(row.status === "unpaid" || row.status === "overdue") && (
                          <button
                            onClick={() => handleMarkAsPaidClick(row)}
                            className="text-[#4134bd] hover:bg-violet-50 p-2 rounded-lg transition-all flex items-center gap-1 ml-auto text-sm font-bold active:scale-95"
                          >
                            <CheckCircle className="w-4 h-4" /> Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">No matching records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Marking Paid */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Payment</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Mark fee for <strong>{targetInvoice?.student?.name}</strong> as paid? This action reflects a manual cash collection.
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
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusFeeManager;