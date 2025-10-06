// types/certificate.ts
export type CertificateType = 'BONAFIDE' | 'COURSE_COMPLETION' | 'TRANSFER' | 'CHARACTER' | 'OTHER';

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'GENERATED';

export interface Certificate {
  id: number;
  studentId: number;
  type: CertificateType;
  reason: string;
  status: CertificateStatus;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedById: number | null;
  rejectionReason: string | null;
  certificateUrl: string | null;
  student: {
    name: string;
    admission_number: string;
    program?: string;
    dateOfBirth?: string;
    department?: {
      name: string;
    };
  };
}

export interface CertificateRequest {
  studentId: number;
  type: CertificateType;
  reason: string;
<<<<<<< HEAD
}
=======
};

export type CertificateType =
  | "BONAFIDE"
  | "COURSE_COMPLETION"
  | "TRANSFER"
  | "CHARACTER"
  | "OTHER";

export type CertificateStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "GENERATED";
>>>>>>> 3db0e6507ee6b533567e050507891dd314d8468c
