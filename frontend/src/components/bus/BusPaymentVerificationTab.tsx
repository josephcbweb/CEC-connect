import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, Loader2, AlertCircle, CreditCard, Search } from "lucide-react";

interface UnpaidInvoice {
  id: number;
  amount: string;
  dueDate: string;
  status: string;
  student: {
    id: number;
    name: string;
    admission_number: string;
    department?: { name: string };
    busStop?: { stopName: string };
  };
  fee: {
    feeType: string;
  };
}

const BusPaymentVerificationTab = () => {
  const [invoices, setInvoices] = useState<UnpaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUnpaidInvoices = async () => {
    try {
      // Fetching invoices with 'unpaid' status
      const res = await axios.get("http://localhost:3000/bus/invoices?status=unpaid");
      
      // We filter for "Bus Fee" types to ensure we only show bus-related payments here
      const busInvoices = res.data.filter((inv: any) => 
        inv.fee?.feeType?.toLowerCase().includes("bus")
      );
      
      setInvoices(busInvoices);
    } catch (err) {
      console.error("Failed to fetch unpaid invoices", err);
      setError("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const handleVerifyPayment = async (invoiceId: number, studentName: string) => {
    const confirm = window.confirm(`Confirm payment receipt for ${studentName}? This will activate their Bus Pass.`);
    if (!confirm) return;

    setVerifyingId(invoiceId);
    try {
      // Triggering the verify-payment endpoint
      await axios.patch(`http://localhost:3000/bus/verify-payment/${invoiceId}`);
      
      // Remove from list locally for instant feedback
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch (err) {
      console.error("Verification failed", err);
      alert("Failed to verify payment. Please try again.");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-violet-500" /></div>;

  if (error) return (
    <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
      <AlertCircle className="w-8 h-8" />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden min-h-[400px]">
      {/* Internal Search / Filter Bar */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name or admission no..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
          Total Pending: <span className="text-violet-600 font-bold">{filteredInvoices.length}</span>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="bg-gray-50 p-4 rounded-full mb-3">
             <CreditCard className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-lg">No pending bus payments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Student</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Department</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Amount Due</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Bus Stop</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{invoice.student.name}</div>
                    <div className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                      {invoice.student.admission_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {invoice.student.department?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-bold">₹{invoice.amount}</div>
                    <div className="text-[10px] text-amber-600 font-semibold uppercase">Cash Pending</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{invoice.student.busStop?.stopName || "Not Assigned"}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleVerifyPayment(invoice.id, invoice.student.name)}
                      disabled={verifyingId === invoice.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#009689] text-white text-xs font-bold rounded-lg hover:bg-[#00796b] transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                      {verifyingId === invoice.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verify & Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BusPaymentVerificationTab;