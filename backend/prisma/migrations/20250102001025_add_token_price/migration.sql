-- CreateTable
CREATE TABLE "TokenPrice" (
    "id" TEXT NOT NULL,
    "priceGroup" TEXT NOT NULL,
    "priceUSD" DECIMAL(20,6) NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenPrice_priceGroup_key" ON "TokenPrice"("priceGroup");
