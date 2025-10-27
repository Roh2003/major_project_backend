/*
  Warnings:

  - The `assignedBy` column on the `user_role_mapping` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user_role_mapping" DROP COLUMN "assignedBy",
ADD COLUMN     "assignedBy" INTEGER;
