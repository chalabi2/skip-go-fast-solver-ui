/*
  Warnings:

  - A unique constraint covering the columns `[orderId,chainId]` on the table `Settlement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Settlement_orderId_key";

-- AlterTable
ALTER TABLE "Settlement" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_orderId_chainId_key" ON "Settlement"("orderId", "chainId");
