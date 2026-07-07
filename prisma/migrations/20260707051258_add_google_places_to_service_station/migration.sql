/*
  Warnings:

  - A unique constraint covering the columns `[userId,googlePlaceId]` on the table `service_stations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "service_stations" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "googleRating" DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "service_stations_userId_googlePlaceId_key" ON "service_stations"("userId", "googlePlaceId");
