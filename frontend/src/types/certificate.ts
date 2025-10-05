// Use type aliases instead of interfaces
export type Certificate = {
  id: number;
  studentId: number;
  type: CertificateType;
  reason: string;
  status: CertificateStatus;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedById?: number;
  rejectionReason?: string;
  certificateUrl?: string;
  student?: {
    name: string;
    admission_number: string;
    department?: {
      name: string;
    };
  };
  approvedBy?: {
    username: string;
  };
};

export type CertificateRequest = {
  studentId: number;
  type: CertificateType;
  reason: string;
};

export type CertificateType =
  | 'BONAFIDE'
  | 'COURSE_COMPLETION'
  | 'TRANSFER'
  | 'CHARACTER'
  | 'OTHER';

export type CertificateStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'GENERATED';