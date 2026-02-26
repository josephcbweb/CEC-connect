export interface FeeDetails {
  id: number;
  feeType: string;
  amount: number;
  dueDate: string;
  studentId: number;
  student?: Student;
  archived?: boolean;
}

export interface Student {
  id: number;
  name: string;
  email?: string;
  departmentId?: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface AssignFeeRequest {
  feeType: string;
  amount: number;
  dueDate: string;
  target: {
    type: "student" | "department";
    id: number;
  };
}

export interface CreateFeeRequest {
  feeType: string;
  amount: number;
  dueDate: string;
  studentId: number;
}
