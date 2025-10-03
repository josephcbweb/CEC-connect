-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "NoDueStatus" AS ENUM ('pending', 'cleared', 'due_found');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('paid', 'unpaid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "RequestWorkflowStatus" AS ENUM ('submitted', 'with_advisor', 'with_hod', 'with_principal', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('successful', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('read', 'unread');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('btech', 'mca');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('general', 'obc', 'sc', 'st', 'ews', 'sebc', 'oec', 'other');

-- CreateEnum
CREATE TYPE "AdmissionQuota" AS ENUM ('merit', 'management', 'government', 'other');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('pending', 'approved', 'rejected', 'waitlisted');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('nri', 'regular', 'lateral', 'management');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" SERIAL NOT NULL,
    "advisor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "gender" "Gender" NOT NULL,
    "religion" TEXT NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "mother_tongue" TEXT NOT NULL,
    "blood_group" TEXT,
    "student_phone_number" TEXT NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "contact_address" TEXT NOT NULL,
    "state_of_residence" TEXT NOT NULL,
    "aadhaar_number" TEXT NOT NULL,
    "fatherName" TEXT,
    "father_phone_number" TEXT,
    "motherName" TEXT,
    "mother_phone_number" TEXT,
    "parent_email" TEXT,
    "annual_family_income" DECIMAL(65,30),
    "guardian_name" TEXT,
    "guardian_relationship" TEXT,
    "guardian_email" TEXT,
    "local_guardian_address" TEXT,
    "local_guardian_phone_number" TEXT,
    "program" "Program" NOT NULL,
    "department_id" INTEGER NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'pending',
    "admission_number" TEXT,
    "admission_date" TIMESTAMP(3),
    "admission_type" "AdmissionType" NOT NULL DEFAULT 'regular',
    "admission_quota" "AdmissionQuota",
    "admitted_category" "Category",
    "category" TEXT,
    "allotted_branch" TEXT NOT NULL,
    "is_fee_concession_eligible" BOOLEAN NOT NULL DEFAULT false,
    "last_institution" TEXT NOT NULL,
    "tc_number" TEXT,
    "tc_date" TIMESTAMP(3),
    "qualifying_exam_name" TEXT NOT NULL,
    "qualifying_exam_register_no" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "previous_degree_cgpa_or_total_marks" DOUBLE PRECISION,
    "physics_score" DOUBLE PRECISION,
    "chemistry_score" DOUBLE PRECISION,
    "maths_score" DOUBLE PRECISION,
    "keam_subject_total" DOUBLE PRECISION,
    "entrance_type" TEXT,
    "entrance_roll_no" TEXT,
    "entrance_rank" INTEGER,
    "entrance_total_score" DOUBLE PRECISION,
    "account_number" TEXT,
    "bank_name" TEXT,
    "ifsc_code" TEXT,
    "bank_branch" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" SERIAL NOT NULL,
    "permission_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "departments" (
    "department_id" SERIAL NOT NULL,
    "department_name" TEXT NOT NULL,
    "hod_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "hod_details" (
    "hod_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "hod_details_pkey" PRIMARY KEY ("hod_id")
);

-- CreateTable
CREATE TABLE "advisor_details" (
    "advisor_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "advisor_details_pkey" PRIMARY KEY ("advisor_id")
);

-- CreateTable
CREATE TABLE "principal_details" (
    "principal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "principal_details_pkey" PRIMARY KEY ("principal_id")
);

-- CreateTable
CREATE TABLE "no_due_requests" (
    "request_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "workflow_status" "RequestWorkflowStatus" NOT NULL DEFAULT 'submitted',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "no_due_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "no_dues" (
    "no_due_id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "status" "NoDueStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "no_dues_pkey" PRIMARY KEY ("no_due_id")
);

-- CreateTable
CREATE TABLE "no_due_approvals" (
    "approval_id" SERIAL NOT NULL,
    "no_due_id" INTEGER NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "approval_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,

    CONSTRAINT "no_due_approvals_pkey" PRIMARY KEY ("approval_id")
);

-- CreateTable
CREATE TABLE "fee_details" (
    "fee_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "fee_type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_details_pkey" PRIMARY KEY ("fee_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "fee_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'unpaid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "setting_id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_phone_number_key" ON "students"("student_phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_aadhaar_number_key" ON "students"("aadhaar_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_admission_number_key" ON "students"("admission_number");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_name_key" ON "permissions"("permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_department_name_key" ON "departments"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_hod_id_key" ON "departments"("hod_id");

-- CreateIndex
CREATE UNIQUE INDEX "hod_details_user_id_key" ON "hod_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hod_details_department_id_key" ON "hod_details"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_details_user_id_key" ON "advisor_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "principal_details_user_id_key" ON "principal_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_details" ADD CONSTRAINT "hod_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hod_details" ADD CONSTRAINT "hod_details_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_details" ADD CONSTRAINT "advisor_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "principal_details" ADD CONSTRAINT "principal_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_requests" ADD CONSTRAINT "no_due_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_dues" ADD CONSTRAINT "no_dues_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "no_due_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_dues" ADD CONSTRAINT "no_dues_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_approvals" ADD CONSTRAINT "no_due_approvals_no_due_id_fkey" FOREIGN KEY ("no_due_id") REFERENCES "no_dues"("no_due_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_due_approvals" ADD CONSTRAINT "no_due_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_details" ADD CONSTRAINT "fee_details_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "fee_details"("fee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
