-- CreateTable
CREATE TABLE "GasTracking" (
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "currentBalance" DECIMAL(36,18) NOT NULL,
    "totalDeposited" DECIMAL(36,18) NOT NULL,
    "currentBalanceUSD" DECIMAL(20,6) NOT NULL,
    "totalDepositedUSD" DECIMAL(20,6) NOT NULL,
    "lastSyncBlock" BIGINT NOT NULL,
    "lastSyncTime" TIMESTAMP(3) NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GasTracking_pkey" PRIMARY KEY ("chainId")
);

-- CreateIndex
CREATE INDEX "GasTracking_chainId_idx" ON "GasTracking"("chainId"); 