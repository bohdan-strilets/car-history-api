-- AlterTable
ALTER TABLE "maintenance_intervals" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "timeline_events" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "tires" ADD COLUMN     "createdBy" TEXT;

-- AddForeignKey
ALTER TABLE "maintenance_intervals" ADD CONSTRAINT "maintenance_intervals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_intervals" ADD CONSTRAINT "maintenance_intervals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tires" ADD CONSTRAINT "tires_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
