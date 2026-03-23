FROM node:22-bookworm-slim AS deps
WORKDIR /app

ARG BUILD_GIT_SHA=unknown
ARG BUILD_IMAGE_TAG=unknown
ARG BUILD_TIME=unknown
ARG BUILD_SOURCE=local

ENV SCARF_ANALYTICS=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app

COPY prisma ./prisma
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ARG BUILD_GIT_SHA=unknown
ARG BUILD_IMAGE_TAG=unknown
ARG BUILD_TIME=unknown
ARG BUILD_SOURCE=local

ENV NODE_ENV=production
ENV SCARF_ANALYTICS=false
ENV BUILD_GIT_SHA=${BUILD_GIT_SHA}
ENV BUILD_IMAGE_TAG=${BUILD_IMAGE_TAG}
ENV BUILD_TIME=${BUILD_TIME}
ENV BUILD_SOURCE=${BUILD_SOURCE}

LABEL org.opencontainers.image.revision=${BUILD_GIT_SHA}
LABEL org.opencontainers.image.version=${BUILD_IMAGE_TAG}
LABEL org.opencontainers.image.created=${BUILD_TIME}
LABEL org.opencontainers.image.source=${BUILD_SOURCE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY public ./public
COPY --from=build /app/node_modules/prisma /app/node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma /app/node_modules/.bin/prisma
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=build /app/dist ./dist

EXPOSE 3010

CMD ["sh", "-lc", "npx prisma migrate deploy && node dist/src/main.js"]
