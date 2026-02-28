import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import type { StudentFee, Invoice } from "../../types";
import { usePermissions } from "../../hooks/usePermissions";

interface StudentDetailsModalProps {
  student: StudentFee;
  onClose: () => void;
  onRefresh: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  onClose,
  onRefresh,
}) => {
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(
    null,
  );
  const [successInvoiceId, setSuccessInvoiceId] = useState<number | null>(null);
  const { hasPermission } = usePermissions();
  const canMarkPaid = hasPermission("fee:mark_paid");

  const handleMarkAsPaid = async (invoiceId: number) => {
    try {
      setProcessingInvoiceId(invoiceId);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3000/fee/invoices/mark-paid",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            invoiceId: invoiceId,
            paymentMethod: "Manual",
            userId: localStorage.getItem("userId"),
          }),
        },
      );
      if (response.ok) {
        setProcessingInvoiceId(null);
        setSuccessInvoiceId(invoiceId);

        // Wait for animation to show success state before refresh
        setTimeout(() => {
          onRefresh();
          setSuccessInvoiceId(null);
        }, 1500);
      } else {
        const errData = await response.json();
        throw new Error(errData.error);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setProcessingInvoiceId(null);
    }
  };

  const invoices = student.invoices || [];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Invoices</h3>
          <div className="max-h-80 overflow-y-auto">
            {invoices.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Fee Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Semester
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {invoice.FeeStructure?.name || "N/A"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div>₹{invoice.amount}</div>
                        {Number(invoice.fineAmount) > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              Fine: ₹{invoice.fineAmount}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1.5">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={invoice.status}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {invoice.status}
                            </motion.span>
                          </AnimatePresence>
                          {invoice.FeeStructure?.fineEnabled && (
                            <div className="group relative">
                              <span className="cursor-help text-amber-500 hover:text-amber-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-3 hidden group-hover:block z-[100] shadow-2xl ring-1 ring-white/10">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-gray-900"></div>
                                <p className="font-semibold mb-2">
                                  Fine Information
                                </p>
                                {invoice.FeeStructure?.fineSlabs &&
                                  invoice.FeeStructure.fineSlabs.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-gray-400 mb-1">
                                        Fine rules:
                                      </p>
                                      {invoice.FeeStructure.fineSlabs.map(
                                        (slab, i) => (
                                          <div
                                            key={i}
                                            className="flex justify-between text-gray-300"
                                          >
                                            <span>
                                              Day {slab.startDay}
                                              {slab.endDay
                                                ? `–${slab.endDay}`
                                                : "+"}
                                              :
                                            </span>
                                            <span>
                                              ₹{slab.amountPerDay}/day
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                {Number(invoice.fineAmount) > 0 && (
                                  <div className="border-t border-gray-600 pt-1.5 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Base Fee:</span>
                                      <span>₹{invoice.baseAmount ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-red-300">
                                      <span>Fine:</span>
                                      <span>+₹{invoice.fineAmount}</span>
                                    </div>
                                    <div className="border-t border-gray-600 pt-1 flex justify-between font-semibold">
                                      <span>Total:</span>
                                      <span>₹{invoice.amount}</span>
                                    </div>
                                  </div>
                                )}
                                {Number(invoice.fineAmount) === 0 && (
                                  <p className="text-gray-400 italic">
                                    No fine charged yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {invoice.semester
                          ? `Semester ${invoice.semester}`
                          : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <AnimatePresence mode="wait">
                          {invoice.status !== "paid" && canMarkPaid && (
                            <motion.div
                              key="action-container"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {successInvoiceId === invoice.id ? (
                                <motion.div
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex items-center text-green-600 font-bold"
                                >
                                  <CheckCircle className="w-5 h-5 mr-1" />
                                  Paid
                                </motion.div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                  disabled={processingInvoiceId !== null}
                                  className={`flex items-center text-teal-600 hover:text-teal-900 font-medium disabled:opacity-50`}
                                >
                                  {processingInvoiceId === invoice.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Mark as Paid"
                                  )}
                                </motion.button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No invoices found for this student.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
