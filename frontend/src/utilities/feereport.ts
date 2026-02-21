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

export const exportToPDF = (students: StudentFee[], filters?: any) => {
  const doc = new jsPDF();

  // --- Document Header ---
  doc.setFontSize(22);
  doc.setTextColor("#16a085"); // Teal color
  doc.text("Student Fee Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

  // --- Filter Details Section ---
  let currentY = 35;
  if (filters) {
    doc.setDrawColor(200);
    doc.line(14, currentY, 196, currentY); // Divider line
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setFont("helvetica", "bold");
    doc.text("Applied Filters:", 14, currentY);
    currentY += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);

    const activeFilters = [];
    if (filters.program) activeFilters.push(`Program: ${filters.program}`);
    if (filters.department) activeFilters.push(`Department: ${filters.department}`);
    if (filters.semester) activeFilters.push(`Semester: ${filters.semester}`);
    if (filters.year) activeFilters.push(`Year: ${filters.year}`);
    if (filters.branch) activeFilters.push(`Branch: ${filters.branch}`);
    if (filters.category) activeFilters.push(`Category: ${filters.category}`);
    if (filters.feeStatus) activeFilters.push(`Status: ${filters.feeStatus}`);
    if (filters.admission_type) activeFilters.push(`Admission: ${filters.admission_type}`);

    // Render filters in a grid-like way or comma-separated
    if (activeFilters.length > 0) {
      const filterText = activeFilters.join("  |  ");
      const splitText = doc.splitTextToSize(filterText, 180);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 5);
    } else {
      doc.text("None", 14, currentY);
      currentY += 5;
    }

    currentY += 5;
    doc.line(14, currentY, 196, currentY); // Bottom divider
    currentY += 10;
  } else {
    currentY = 40;
  }

  // --- Table Content ---
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
      index + 1,
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

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: "grid",
    headStyles: {
      fillColor: [22, 160, 133],
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
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30 },
      4: { fontSize: 8 },
      5: { fontSize: 8 },
      6: { fontSize: 8 },
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

  doc.save(`student_fee_report_${new Date().getTime()}.pdf`);
};
