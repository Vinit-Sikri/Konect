/*
  Warnings:

  - You are about to drop the column `content` on the `messages` table. All the data in the column will be lost.
  - Added the required column `message` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "content",
ADD COLUMN     "message" TEXT NOT NULL;
