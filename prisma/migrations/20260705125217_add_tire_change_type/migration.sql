/*
  Warnings:

  - Added the required column `changeType` to the `tire_changes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TireChangeType" AS ENUM ('INSTALL', 'REMOVE');

-- AlterTable
ALTER TABLE "tire_changes" ADD COLUMN     "changeType" "TireChangeType" NOT NULL;
