-- CreateTable
CREATE TABLE "graduated_students" (
    "graduated_student_id" SERIAL NOT NULL,
    "original_student_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL,
    "student_phone_number" TEXT NOT NULL,
    "aadhaar_number" TEXT NOT NULL,
    "program" "Program" NOT NULL,
    "department_id" INTEGER,
    "admission_number" TEXT,
    "admission_date" TIMESTAMP(3),
    "passout_year" INTEGER,
    "graduated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_by" INTEGER,
    "allotted_branch" TEXT NOT NULL,

    CONSTRAINT "graduated_students_pkey" PRIMARY KEY ("graduated_student_id")
);

-- CreateTable
CREATE TABLE "promotion_history" (
    "promotion_id" SERIAL NOT NULL,
    "promotion_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semester_type" TEXT NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "promotion_details" JSONB NOT NULL,
    "can_undo" BOOLEAN NOT NULL DEFAULT true,
    "undo_at" TIMESTAMP(3),

    CONSTRAINT "promotion_history_pkey" PRIMARY KEY ("promotion_id")
);

-- AddForeignKey
ALTER TABLE "promotion_history" ADD CONSTRAINT "promotion_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
