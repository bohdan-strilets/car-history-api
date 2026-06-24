-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_milestones" DROP CONSTRAINT "vehicle_milestones_userId_fkey";

-- CreateIndex
CREATE INDEX "mileage_logs_vehicleId_source_idx" ON "mileage_logs"("vehicleId", "source");

-- AddForeignKey
ALTER TABLE "vehicle_milestones" ADD CONSTRAINT "vehicle_milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
