-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "compactMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "numberFormat" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN     "showAnimations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light',
ADD COLUMN     "timeFormat" TEXT NOT NULL DEFAULT '12',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';
