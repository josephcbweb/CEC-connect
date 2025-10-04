/*
  Warnings:

  - A unique constraint covering the columns `[department_code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "department_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "departments_department_code_key" ON "departments"("department_code");
