export interface Student {
  id: number;
  name: string;
  email: string | null;
  gender: "Male" | "Female" | "Other";
  departmentId: number;
  department: Department;
  program: string;
  currentSemester?: number; // Added currentSemester
  allotted_branch: string;
  admitted_category: string | null;
  entrance_total_score: number | null;
  admission_type: string;
  category: string;
  fatherName: string | null;
  father_phone_number: string | null;
  motherName: string | null;
  mother_phone_number: string | null;
  admission_number: string | null;
  admission_date: string | null;
  status: string;
  student_phone_number: string;
  createdAt: string;
  updatedAt: string;
  feeDetails?: FeeDetails[];
  invoices?: Invoice[];
}

export interface Department {
  id: number;
  name: string;
  department_code: string;
}

export interface FeeDetails {
  id: number;
  feeType: string;
  amount: number;
  dueDate: string;
  studentId: number;
  archived?: boolean;
}

export interface FineSlab {
  id?: number;
  startDay: number;
  endDay: number | null;
  amountPerDay: number;
}

export interface FeeStructure {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  fineEnabled: boolean;
  fineSlabs: FineSlab[];
}

export interface Invoice {
  id: number;
  studentId: number;
  feeId: number;
  FeeStructure: FeeStructure | null;
  fee: { feeType: string; archived?: boolean };
  amount: number;
  baseAmount: number | null;
  fineAmount: number;
  dueDate: string;
  issueDate: string;
  status: "paid" | "unpaid" | "overdue";
  semester?: number;
}

export interface StudentFee extends Student {
  feeStatus: "pending" | "due" | "paid" | "overdue";
  totalDue: number;
  totalPaid: number;
  pendingAmount: number;
  latestDueDate?: string;
}

export interface SortConfig {
  key: keyof StudentFee | "";
  direction: "asc" | "desc";
}

export interface FilterConfig {
  department: string;
  branch: string; // Added branch
  category: string;
  gender: string;
  feeStatus: string;
  program: string;
  semester: string; // Added semester
  admission_type: string;
}
