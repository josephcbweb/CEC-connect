/*
  Warnings:

  - The `admission_quota` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "admission_quota",
ADD COLUMN     "admission_quota" TEXT;

-- DropEnum
DROP TYPE "public"."AdmissionQuota";
