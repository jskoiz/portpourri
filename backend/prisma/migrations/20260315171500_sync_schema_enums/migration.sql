-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'PHONE', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');

-- CreateEnum
CREATE TYPE "IntensityLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'BLOCK', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RUNNING', 'CYCLING', 'HIKING', 'YOGA', 'FITNESS', 'SWIMMING', 'SURFING', 'BOXING', 'PADDLING', 'VOLLEYBALL', 'CLIMBING', 'PILATES', 'DANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

-- AlterTable
ALTER TABLE "events" DROP COLUMN "category",
ADD COLUMN     "category" "EventCategory";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "category",
ADD COLUMN     "category" "ReportCategory" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user_fitness_profile" DROP COLUMN "intensity_level",
ADD COLUMN     "intensity_level" "IntensityLevel" NOT NULL DEFAULT 'INTERMEDIATE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth_provider",
ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL DEFAULT 'PHONE',
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "users_is_deleted_is_banned_is_onboarded_idx" ON "users"("is_deleted", "is_banned", "is_onboarded");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
