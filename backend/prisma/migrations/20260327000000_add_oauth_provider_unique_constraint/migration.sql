-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_provider_id_key" ON "users"("auth_provider", "provider_id");
