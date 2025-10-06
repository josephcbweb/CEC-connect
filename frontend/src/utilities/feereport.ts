import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudentFee } from "../types";

// --- Indian Rupee Formatting ---
const formatCurrencyForPDF = (amount: number | string | undefined | null) => {
  const num = Number(amount || 0);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  // FIX: Remove the space between the currency symbol and the number to prevent overflow
  return formatted.replace(/\s/g, "");
};

export const exportToPDF = (students: StudentFee[]) => {
  const doc = new jsPDF();

  // --- Document Header ---
  doc.setFontSize(20);
  doc.setTextColor("#16a085"); // Teal color
  doc.text("Student Fee Report", 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 30);

  // --- Table Content ---
  // MODIFIED: Removed the "ID" column from the header
  const tableColumn = [
    "Sl. No.",
    "Name",
    "Admission No.",
    "Fee Status",
    "Total Due",
    "Total Paid",
    "Pending",
  ];
  const tableRows: (string | number)[][] = [];

  students.forEach((student, index) => {
    const studentData = [
      index + 1, // Serial number for each row
      // MODIFIED: Removed student.id from the data row
      student.name || "N/A",
      student.admission_number || "N/A",
      student.feeStatus
        ? student.feeStatus.charAt(0).toUpperCase() + student.feeStatus.slice(1)
        : "N/A",
      formatCurrencyForPDF(student.totalDue),
      formatCurrencyForPDF(student.totalPaid),
      formatCurrencyForPDF(student.pendingAmount),
    ];
    tableRows.push(studentData);
  });

  // Call autoTable as a function, passing the doc instance.
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: "grid",
    headStyles: {
      fillColor: [22, 160, 133], // Teal color for header
      textColor: 255,
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    // MODIFIED: Adjusted column styles
    columnStyles: {
      0: { cellWidth: 15 }, // Sl. No.
      1: { cellWidth: "auto" }, // Name
      2: { cellWidth: 30 }, // Admission No.
      // ADDED: Smaller font size for currency columns to prevent overflow
      4: { fontSize: 8 }, // Total Due
      5: { fontSize: 8 }, // Total Paid
      6: { fontSize: 8 }, // Pending
    },
  });

  // --- Footer ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Student Fee Report`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // --- Save the PDF ---
  doc.save("student_fee_report.pdf");
};
