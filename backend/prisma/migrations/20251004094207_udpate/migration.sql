/*
  Warnings:

  - Made the column `department_code` on table `departments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "AdmissionQuota" ADD VALUE 'nri';

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "department_code" SET NOT NULL;
