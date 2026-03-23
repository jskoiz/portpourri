BEGIN;

DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'PHONE', 'GOOGLE', 'APPLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IntensityLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportCategory" AS ENUM ('HARASSMENT', 'SPAM', 'INAPPROPRIATE', 'BLOCK', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventCategory" AS ENUM ('RUNNING', 'CYCLING', 'HIKING', 'YOGA', 'FITNESS', 'SWIMMING', 'SURFING', 'BOXING', 'PADDLING', 'VOLLEYBALL', 'CLIMBING', 'PILATES', 'DANCE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ALTER COLUMN "auth_provider" DROP DEFAULT,
  ALTER COLUMN "auth_provider" TYPE "AuthProvider"
  USING (
    CASE lower(trim("auth_provider"))
      WHEN 'email' THEN 'EMAIL'::"AuthProvider"
      WHEN 'phone' THEN 'PHONE'::"AuthProvider"
      WHEN 'google' THEN 'GOOGLE'::"AuthProvider"
      WHEN 'apple' THEN 'APPLE'::"AuthProvider"
      ELSE 'PHONE'::"AuthProvider"
    END
  ),
  ALTER COLUMN "auth_provider" SET DEFAULT 'PHONE';

ALTER TABLE "users"
  ALTER COLUMN "gender" TYPE "Gender"
  USING (
    CASE lower(trim("gender"))
      WHEN 'male' THEN 'MALE'::"Gender"
      WHEN 'man' THEN 'MALE'::"Gender"
      WHEN 'female' THEN 'FEMALE'::"Gender"
      WHEN 'woman' THEN 'FEMALE'::"Gender"
      WHEN 'non-binary' THEN 'NON_BINARY'::"Gender"
      WHEN 'non_binary' THEN 'NON_BINARY'::"Gender"
      WHEN 'nonbinary' THEN 'NON_BINARY'::"Gender"
      WHEN 'other' THEN 'OTHER'::"Gender"
      ELSE 'OTHER'::"Gender"
    END
  );

ALTER TABLE "user_fitness_profile"
  ALTER COLUMN "intensity_level" DROP DEFAULT,
  ALTER COLUMN "intensity_level" TYPE "IntensityLevel"
  USING (
    CASE lower(trim("intensity_level"))
      WHEN 'low' THEN 'BEGINNER'::"IntensityLevel"
      WHEN 'beginner' THEN 'BEGINNER'::"IntensityLevel"
      WHEN 'moderate' THEN 'INTERMEDIATE'::"IntensityLevel"
      WHEN 'intermediate' THEN 'INTERMEDIATE'::"IntensityLevel"
      WHEN 'high' THEN 'ADVANCED'::"IntensityLevel"
      WHEN 'advanced' THEN 'ADVANCED'::"IntensityLevel"
      ELSE 'INTERMEDIATE'::"IntensityLevel"
    END
  ),
  ALTER COLUMN "intensity_level" SET DEFAULT 'INTERMEDIATE';

ALTER TABLE "events"
  ALTER COLUMN "category" TYPE "EventCategory"
  USING (
    CASE
      WHEN "category" IS NULL THEN NULL
      WHEN lower(trim("category")) IN ('running', 'run') THEN 'RUNNING'::"EventCategory"
      WHEN lower(trim("category")) = 'cycling' THEN 'CYCLING'::"EventCategory"
      WHEN lower(trim("category")) IN ('hiking', 'hike') THEN 'HIKING'::"EventCategory"
      WHEN lower(trim("category")) = 'yoga' THEN 'YOGA'::"EventCategory"
      WHEN lower(trim("category")) IN ('fitness', 'strength', 'endurance', 'wellness') THEN 'FITNESS'::"EventCategory"
      WHEN lower(trim("category")) = 'swimming' THEN 'SWIMMING'::"EventCategory"
      WHEN lower(trim("category")) = 'surfing' THEN 'SURFING'::"EventCategory"
      WHEN lower(trim("category")) = 'boxing' THEN 'BOXING'::"EventCategory"
      WHEN lower(trim("category")) = 'paddling' THEN 'PADDLING'::"EventCategory"
      WHEN lower(trim("category")) = 'volleyball' THEN 'VOLLEYBALL'::"EventCategory"
      WHEN lower(trim("category")) = 'climbing' THEN 'CLIMBING'::"EventCategory"
      WHEN lower(trim("category")) = 'pilates' THEN 'PILATES'::"EventCategory"
      WHEN lower(trim("category")) = 'dance' THEN 'DANCE'::"EventCategory"
      ELSE 'OTHER'::"EventCategory"
    END
  );

ALTER TABLE "messages"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "MessageType"
  USING (
    CASE lower(trim("type"))
      WHEN 'text' THEN 'TEXT'::"MessageType"
      WHEN 'image' THEN 'IMAGE'::"MessageType"
      WHEN 'system' THEN 'SYSTEM'::"MessageType"
      ELSE 'TEXT'::"MessageType"
    END
  ),
  ALTER COLUMN "type" SET DEFAULT 'TEXT';

ALTER TABLE "reports"
  ALTER COLUMN "category" TYPE "ReportCategory"
  USING (
    CASE lower(trim("category"))
      WHEN 'harassment' THEN 'HARASSMENT'::"ReportCategory"
      WHEN 'spam' THEN 'SPAM'::"ReportCategory"
      WHEN 'inappropriate' THEN 'INAPPROPRIATE'::"ReportCategory"
      WHEN 'block' THEN 'BLOCK'::"ReportCategory"
      ELSE 'OTHER'::"ReportCategory"
    END
  ),
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReportStatus"
  USING (
    CASE lower(trim("status"))
      WHEN 'open' THEN 'PENDING'::"ReportStatus"
      WHEN 'pending' THEN 'PENDING'::"ReportStatus"
      WHEN 'reviewed' THEN 'REVIEWED'::"ReportStatus"
      WHEN 'resolved' THEN 'RESOLVED'::"ReportStatus"
      WHEN 'dismissed' THEN 'DISMISSED'::"ReportStatus"
      ELSE 'PENDING'::"ReportStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE TABLE IF NOT EXISTS "Notification" (
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

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "users_is_deleted_is_banned_is_onboarded_idx" ON "users"("is_deleted", "is_banned", "is_onboarded");

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
