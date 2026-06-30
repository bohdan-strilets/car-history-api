-- AlterTable
ALTER TABLE "services" ADD COLUMN     "maintenanceIntervalId" TEXT;

-- CreateIndex
CREATE INDEX "services_maintenanceIntervalId_idx" ON "services"("maintenanceIntervalId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_maintenanceIntervalId_fkey" FOREIGN KEY ("maintenanceIntervalId") REFERENCES "maintenance_intervals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
