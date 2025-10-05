import React from "react";
import type { StudentFee } from "../../types";

interface StatsCardsProps {
  students: StudentFee[];
}

// Helper function to format numbers as Indian currency (INR)
const formatCurrencyINR = (amount: number | string): string => {
  // Ensure the input is a valid number before formatting
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0, // Hides decimals like .00
  }).format(numericAmount);
};

const StatsCards: React.FC<StatsCardsProps> = ({ students }) => {
  const totalStudents = students.length;
  const paidStudents = students.filter((s) => s.feeStatus === "paid").length;
  const dueStudents = students.filter((s) => s.feeStatus === "due").length;
  const overdueStudents = students.filter(
    (s) => s.feeStatus === "overdue"
  ).length;

  const totalRevenue = students.reduce(
    (sum, student) => sum + Number(student.totalPaid),
    0
  );
  const totalPending = students.reduce(
    (sum, student) => sum + Number(student.pendingAmount),
    0
  );

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
    },
    {
      title: "Fees Paid",
      value: paidStudents,
    },
    {
      title: "Fees Due",
      value: dueStudents,
    },
    {
      title: "Overdue",
      value: overdueStudents,
    },
    {
      title: "Total Collected",
      value: formatCurrencyINR(totalRevenue),
    },
    {
      title: "Pending Amount",
      value: formatCurrencyINR(totalPending),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
