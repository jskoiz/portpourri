-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'EVENT_INVITE';

-- CreateTable
CREATE TABLE "event_invites" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "event_id" UUID NOT NULL,
    "inviter_id" UUID NOT NULL,
    "invitee_id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',

    CONSTRAINT "event_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_invites_invitee_id_idx" ON "event_invites"("invitee_id");

-- CreateIndex
CREATE INDEX "event_invites_match_id_idx" ON "event_invites"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_invites_event_id_invitee_id_key" ON "event_invites"("event_id", "invitee_id");

-- AddForeignKey
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
