#!/usr/bin/env bash

set -euo pipefail

ENV_FILE=".env"

error() {
  echo "Error: $1" >&2
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  error ".env file not found."
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

required_vars=(
  FNAUTHZ_STRIPE_SECRET_KEY
  FNAUTHZ_INFLUXDB_URL
  FNAUTHZ_INFLUXDB_TOKEN
  FNAUTHZ_NATS_URL,
  IDENTITY_DATABASE_URL,
  CLOAK_ENCRYPTION_KEY
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    error "Required environment variable '$var' is not set."
  fi
done

nodemon --watch src src/server.ts
