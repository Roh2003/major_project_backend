/*
  Warnings:

  - You are about to drop the column `videourl` on the `lessons` table. All the data in the column will be lost.
  - Added the required column `videoId` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "videourl",
ADD COLUMN     "videoId" TEXT NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;
