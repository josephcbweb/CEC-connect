import React from "react";
import type { StudentFee, Invoice } from "../../types";

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
  const handleMarkAsPaid = async (invoiceId: number) => {
    if (!window.confirm("Are you sure you want to mark this invoice as paid?"))
      return;
    try {
      const response = await fetch(
        "http://localhost:3000/fee/invoices/mark-paid",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoiceId,
            paymentMethod: "Manual",
          }),
        }
      );
      if (response.ok) {
        alert("Invoice marked as paid!");
        onRefresh();
        onClose();
      } else {
        const errData = await response.json();
        throw new Error(errData.error);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {invoice.FeeStructure.name || "N/A"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        ₹{invoice.amount}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {invoice.status !== "paid" && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            Mark as Paid
                          </button>
                        )}
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
