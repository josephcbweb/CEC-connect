// src/types/certificate.ts
export type CertificateType = "BONAFIDE" | "COURSE_COMPLETION" | "TRANSFER" | "CHARACTER" | "OTHER";
export type CertificateStatus = "PENDING" | "APPROVED" | "REJECTED" | "GENERATED";
export type CertificateWorkflowStatus = 
  | "SUBMITTED" 
  | "WITH_ADVISOR" 
  | "WITH_HOD" 
  | "WITH_OFFICE" 
  | "WITH_PRINCIPAL" 
  | "COMPLETED" 
  | "REJECTED";

export interface CertificateApproval {
  id: number;
  role: string;
  action: string;
  remarks: string;
  createdAt: string;
  approver: {
    username: string;
  };
}

export interface Certificate {
  id: number;
  studentId: number;
  type: CertificateType;
  reason: string;
  status: CertificateStatus;
  workflowStatus: CertificateWorkflowStatus;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  certificateUrl?: string;
  advisorId?: number;
  advisorActionAt?: string;
  advisorRemarks?: string;
  hodId?: number;
  hodActionAt?: string;
  hodRemarks?: string;
  officeId?: number;
  officeActionAt?: string;
  officeRemarks?: string;
  principalId?: number;
  principalActionAt?: string;
  principalRemarks?: string;
  student?: {
    name: string;
    admission_number: string;
    program?: string;
    class?: { name: string };
    department?: { name: string };
  };
  approvals?: CertificateApproval[];
}

export interface CertificateRequest {
  studentId: number;
  type: CertificateType;
  reason: string;
}