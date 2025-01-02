-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "profit" DECIMAL(20,6) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainSync" (
    "chainId" INTEGER NOT NULL,
    "lastSyncBlock" BIGINT NOT NULL,
    "lastSyncTime" TIMESTAMP(3) NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainSync_pkey" PRIMARY KEY ("chainId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_orderId_key" ON "Settlement"("orderId");

-- CreateIndex
CREATE INDEX "Settlement_chainId_timestamp_idx" ON "Settlement"("chainId", "timestamp");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");
