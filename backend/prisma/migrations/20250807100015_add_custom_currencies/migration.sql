-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "customCurrencyId" TEXT;

-- CreateTable
CREATE TABLE "custom_currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exchangeRate" DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "custom_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_currencies_code_key" ON "custom_currencies"("code");

-- CreateIndex
CREATE INDEX "custom_currencies_userId_idx" ON "custom_currencies"("userId");

-- CreateIndex
CREATE INDEX "custom_currencies_code_idx" ON "custom_currencies"("code");

-- CreateIndex
CREATE INDEX "user_preferences_customCurrencyId_idx" ON "user_preferences"("customCurrencyId");

-- AddForeignKey
ALTER TABLE "custom_currencies" ADD CONSTRAINT "custom_currencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_customCurrencyId_fkey" FOREIGN KEY ("customCurrencyId") REFERENCES "custom_currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
