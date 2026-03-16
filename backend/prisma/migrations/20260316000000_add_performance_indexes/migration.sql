-- Add indexes for discovery filters on UserProfile
CREATE INDEX "user_profile_latitude_longitude_idx" ON "user_profile"("latitude", "longitude");
CREATE INDEX "user_profile_discovery_paused_idx" ON "user_profile"("discovery_paused");

-- Add indexes for discovery filters on User
CREATE INDEX "users_birthdate_idx" ON "users"("birthdate");
CREATE INDEX "users_gender_idx" ON "users"("gender");

-- Add index for event category filtering
CREATE INDEX "events_category_idx" ON "events"("category");

-- Add index for report status (moderation queue)
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- Rename Notification table to use consistent snake_case naming
ALTER TABLE "Notification" RENAME TO "notifications";

-- Rename associated indexes and constraints
ALTER INDEX "Notification_pkey" RENAME TO "notifications_pkey";
ALTER INDEX "Notification_userId_createdAt_idx" RENAME TO "notifications_userId_createdAt_idx";
ALTER INDEX "Notification_userId_read_idx" RENAME TO "notifications_userId_read_idx";
ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_userId_fkey" TO "notifications_userId_fkey";
