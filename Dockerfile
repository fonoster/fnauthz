##
# Build stage
##
FROM node:20-slim AS builder
LABEL author="Fonoster Team <team@fonoster.com>"

WORKDIR /work
COPY . .

RUN apt-get update && apt-get install -y libssl-dev \
  && npm rebuild \
  && cp node_modules/\@fonoster/identity/dist/generated/\@prisma/client/schema.prisma . \
  && npx prisma generate --schema schema.prisma \
  && rm -rf node_modules/@fonoster/identity/dist/generated \
  && mv src/generated node_modules/@fonoster/identity/dist/ \
  && rm -rf /var/lib/apt/lists/*

##
# Run stage
##
FROM node:20-slim

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser \
  && apt-get update && apt-get install -y libssl-dev \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=appuser:appuser work/dist /home/appuser/fnauthz/dist
COPY --from=builder --chown=appuser:appuser work/package.json /home/appuser/fnauthz/package.json
COPY --from=builder --chown=appuser:appuser work/node_modules /home/appuser/fnauthz/node_modules

WORKDIR /home/appuser/fnauthz

USER appuser

CMD ["node", "/home/appuser/fnauthz/dist/server.js"]
