# BRDG Lightsail deployment

BRDG deploys the backend API to a single Ubuntu Lightsail instance with:

- a versioned backend image published to GHCR
- Postgres in Docker
- Cloudflare Tunnel for public HTTPS
- a repository-scoped GitHub Actions runner labeled `brdg-vps`

Recommended production API host:

- `api.brdg.social`

Production deploys are workflow-only. Use [`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml) from `main`; do not copy the repo onto the host or build the backend image on the instance.

Treat backend deploy provenance as a three-surface check:

1. workflow manifest in `artifacts/backend-deploy/release-manifest.json`
2. host runtime bundle at `/opt/brdg/runtime/api/release-manifest.json`
3. running backend surfaces at `GET /health` and `GET /build-info`

The deploy is not trustworthy unless those surfaces agree on `gitSha`, `imageTag`, `buildTime`, and workflow source.

## Managed config

The production workflow renders runtime files from AWS SSM Parameter Store under `/brdg/prod/backend/*`.

Required parameters:

- `NODE_ENV`
- `PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `JWT_SECRET`
- `BASE_URL`
- `API_BASE_URL`
- `ALLOWED_ORIGINS`
- `CLOUDFLARED_CREDENTIALS_JSON`

Deploy-time `API_IMAGE` is injected by the workflow and is not stored in SSM.

The committed runtime assets live in [`deploy/api`](../deploy/api):

- [`docker-compose.yml`](../deploy/api/docker-compose.yml)
- [`production.env.schema.json`](../deploy/api/production.env.schema.json)
- [`cloudflared/config.yml`](../deploy/api/cloudflared/config.yml)

The host runtime directory should contain only rendered runtime files and pulled images:

- `/opt/brdg/runtime/api/docker-compose.yml`
- `/opt/brdg/runtime/api/.env`
- `/opt/brdg/runtime/api/release-manifest.json`
- `/opt/brdg/runtime/api/cloudflared/config.yml`
- `/opt/brdg/runtime/api/cloudflared/credentials.json`

It must not act as a repo checkout.

GitHub Actions now targets the self-hosted runner with `runs-on: [self-hosted, Linux, X64, brdg-vps]`. That keeps PR and deploy workflows off GitHub-hosted minutes, but it also means CI shares CPU, memory, disk, and Docker with the production backend host. Service containers must use dynamically assigned host ports instead of assuming standard ports like `5432` are free on the machine.

## Server bootstrap

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
sudo usermod -aG docker ubuntu
```

## Workflow deploy

The backend workflow supports:

- push-to-`main` deploys
- manual deploys for a specific `git_sha`
- `dry_run` to build, render config, and validate without touching the host
- `rollback_image_tag` to redeploy a previously published GHCR image tag

The workflow:

1. runs `npm run check:backend`
2. rehearses the legacy enum migration path with `npm run rehearse:backend:legacy-migrations`
3. builds and pushes `ghcr.io/<owner>/brdg-api:<full_sha>` plus `:main`
4. renders `.env` and Cloudflare credentials/config from SSM
5. uploads only runtime files to `/opt/brdg/runtime/api`
6. pulls the exact image tag on Lightsail and restarts `postgres`, `cloudflared`, and `api`
7. compares the host-local `/health.build` payload against `release-manifest.json`
8. verifies hosted health and build provenance against the workflow manifest

## Manual validation helpers

From repo root:

```bash
npm run deploy:backend:validate-env -- --input path/to/rendered/.env
npm run check:hosted-backend -- --api-base-url https://api.brdg.social \
  --expected-git-sha <full_sha> \
  --expected-image-tag ghcr.io/<owner>/brdg-api:<full_sha> \
  --expected-build-time <utc_timestamp> \
  --expected-source <workflow_run_url>
npm run check:prisma-migration-safety
```

The workflow uses `scripts/render-backend-env.mjs` to read SSM and write the runtime bundle, and `scripts/check-hosted-backend.mjs` to gate rollout completion.

`scripts/check-hosted-backend.mjs` now verifies both HTTP status expectations and, when expected values are provided, the provenance fields returned by `GET /health` and `GET /build-info`.

## Legacy migration repair

Historical Prisma migration `20260315171500_sync_schema_enums` is not production-safe against the older text-column schema. Do not rewrite that historical migration.

Use these repo-owned repair assets when rehearsing or recovering a legacy environment:

- [`backend/prisma/manual-repairs/20260315171500_legacy_enum_upgrade.sql`](../backend/prisma/manual-repairs/20260315171500_legacy_enum_upgrade.sql)
- [`backend/prisma/manual-repairs/legacy-pre-enum-fixture.sql`](../backend/prisma/manual-repairs/legacy-pre-enum-fixture.sql)

CI exercises that path before deploy. Future schema changes must follow expand/backfill/contract instead of destructive drop-and-recreate conversions.

## Verify

```bash
curl -I https://api.brdg.social
curl https://api.brdg.social/health
npm run check:hosted-backend -- --api-base-url https://api.brdg.social
```

Successful rollout means:

- `GET /health` returns `200`
- guarded profile mutation routes return `401`, not `404` or `502`
- `/health.build` and `/build-info` report the expected `gitSha`, `imageTag`, `buildTime`, and workflow source from the deploy manifest

Manual reconciliation commands:

```bash
curl https://api.brdg.social/health
curl https://api.brdg.social/build-info
cat /opt/brdg/runtime/api/release-manifest.json
```

For rollbacks, `rollback_image_tag` intentionally changes the expected image tag. The provenance comparison should still be made against the selected workflow/runtime manifest, not local repo state.
