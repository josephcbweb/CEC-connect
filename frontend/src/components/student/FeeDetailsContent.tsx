import type { FeeStructure, Invoice, Student } from "../../types";

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusBadge = (status: "paid" | "unpaid" | "overdue") => {
  const styles = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: string; color?: string }> = ({
  title,
  value,
  color = "text-gray-800",
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);
interface StudentWithFees extends Student {
  invoices: (Invoice & { FeeStructure: FeeStructure | null })[];
}
export const FeeDetailsContent: React.FC<{ studentData: StudentWithFees }> = ({
  studentData,
}) => {
  const totalDue = studentData.invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount as any),
    0
  );
  const totalPaid = studentData.invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount as any), 0);
  const outstandingBalance = totalDue - totalPaid;
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Fee Payment Portal</h1>
      <p className="mt-1 text-lg text-gray-600">
        Here is a summary of your account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard title="Total Due Amount" value={formatCurrency(totalDue)} />
        <StatCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          color="text-green-600"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          color={outstandingBalance > 0 ? "text-red-600" : "text-gray-800"}
        />
      </div>

      <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Invoice History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentData.invoices.length > 0 ? (
                studentData.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      #{invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.FeeStructure?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status !== "paid" && (
                        <button className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-xs font-semibold">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    You have no invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
