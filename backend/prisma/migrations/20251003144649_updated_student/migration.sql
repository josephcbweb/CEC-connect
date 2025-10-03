/*
  Warnings:

  - The `admitted_category` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "admitted_category",
ADD COLUMN     "admitted_category" TEXT;

-- DropEnum
DROP TYPE "public"."Category";
