export interface AdmissionStudent {
  id: number;
  name: string;
  email: string;
  student_phone_number: string;
  admission_number: string;
  program: "BTECH" | "MCA" | "MTECH";
  admission_type: "regular" | "lateral" | "nri" | "management";
  status: "pending" | "approved" | "rejected" | "waitlisted";
  admission_date: string;
  admissionSubmittedAt: string;
  dateOfBirth?: string;
  gender: string;
  aadhaar_number: string;
  blood_group?: string;
  religion: string;
  nationality: string;
  mother_tongue: string;
  permanent_address: string;
  contact_address: string;
  state_of_residence: string;
  fatherName?: string;
  father_phone_number?: string;
  motherName?: string;
  mother_phone_number?: string;
  parent_email?: string;
  annual_family_income?: number;
  guardian_name?: string;
  local_guardian_address?: string;
  local_guardian_phone_number?: string;
  allotted_branch: string;
  is_fee_concession_eligible: boolean;
  last_institution: string;
  tc_number?: string;
  tc_date?: string;
  qualifying_exam_name: string;
  qualifying_exam_register_no: string;
  percentage?: number;
  physics_score?: number;
  chemistry_score?: number;
  maths_score?: number;
  entrance_type?: string;
  entrance_roll_no?: string;
  entrance_rank?: number;
  entrance_total_score?: number;
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  bank_branch?: string;
  admitted_category?: string;
  department?: {
    id: number;
    name: string;
    department_code: string;
  } | null;
  preferredDepartmentId?: number | null;
  preferredDepartment?: {
    id: number;
    name: string;
    department_code: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  waitlisted: number;
  unassignedApproved: number;
  byProgram: {
    BTECH: number;
    MCA: number;
    MTECH?: number;
  };
  byAdmissionType: {
    regular: number;
    lateral: number;
    nri: number;
    management: number;
  };
}

export interface AdmissionWindow {
  id: number;
  program: "BTECH" | "MCA" | "MTECH";
  startDate: string;
  endDate: string;
  isOpen: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  batch?: Batch;
}

export interface Batch {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  batchDepartments?: {
    id: number;
    batchId: number;
    departmentId: number;
  }[];
}

export interface AdmissionFormData {
  program: string;
  admissionType: string;
  personalInfo: {
    name: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    aadhaar: string;
    bloodGroup?: string;
    religion: string;
    nationality?: string;
    motherTongue: string;
  };
  parentInfo: {
    fatherName: string;
    fatherPhone: string;
    motherName: string;
    motherPhone: string;
    parentEmail?: string;
    annualFamilyIncome: string;
  };
  addressInfo: {
    permanentAddress: string;
    permanentAddressState: string;
    contactAddress?: string;
    contactAddressState?: string;
    localGuardianName?: string;
    localGuardianAddress?: string;
    localGuardianPhone?: string;
  };
  educationInfo: {
    qualifyingExam: string;
    examRegisterNumber: string;
    examInstitute: string;
    physicsScore: string;
    chemistryScore: string;
    mathsScore: string;
    totalPercentage: string;
    tcNumber?: string;
    tcDate?: string;
    tcIssuedBy?: string;
  };
  entranceInfo: {
    examType: string;
    examRollNumber: string;
    examRank: string;
    examScore: string;
  };
  bankInfo: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    bankBranch: string;
  };
  additionalInfo: {
    admittedCategory: string;
    feeConcessionEligible?: boolean;
    allottedBranch?: string;
  };
  departmentId?: number;
}

export interface SortConfig {
  key: keyof AdmissionStudent;
  direction: "asc" | "desc";
}
