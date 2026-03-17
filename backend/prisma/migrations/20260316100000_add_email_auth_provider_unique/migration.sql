-- Drop the old single-column email index
DROP INDEX IF EXISTS "users_email_idx";

-- Add composite unique constraint on (email, auth_provider)
CREATE UNIQUE INDEX "users_email_auth_provider_key" ON "users"("email", "auth_provider");
