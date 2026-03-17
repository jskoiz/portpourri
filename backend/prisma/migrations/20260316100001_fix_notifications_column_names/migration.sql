-- Rename camelCase columns to snake_case in notifications table
ALTER TABLE "notifications" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "notifications" RENAME COLUMN "readAt" TO "read_at";
ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "notifications" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename indexes to match new column names
DROP INDEX IF EXISTS "notifications_userId_createdAt_idx";
DROP INDEX IF EXISTS "notifications_userId_read_idx";
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- Rename foreign key constraint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
