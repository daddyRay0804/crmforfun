#!/usr/bin/env bash
set -euo pipefail

# Allow overrides via env:
# - BASE_URL / API_URL (highest priority)
# - ADMIN_PORT / API_PORT
# If not provided, try to auto-detect published ports from docker compose.

autodetect_port() {
  local svc="$1"; local container_port="$2";
  if command -v docker >/dev/null 2>&1 && command -v docker-compose >/dev/null 2>&1; then
    :
  fi
  if command -v docker >/dev/null 2>&1 && command -v docker >/dev/null 2>&1; then
    # docker compose port <service> <port>
    if command -v docker >/dev/null 2>&1; then
      local out
      out=$(docker compose port "$svc" "$container_port" 2>/dev/null | head -n 1 || true)
      # expected: 0.0.0.0:3101 or [::]:3101
      if [[ "$out" =~ :([0-9]+)$ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
      fi
    fi
  fi
  return 1
}

if [[ -z "${API_URL:-}" ]]; then
  if [[ -n "${API_PORT:-}" ]]; then
    API_URL="http://localhost:${API_PORT}"
  else
    API_PORT_DETECTED=$(autodetect_port api 3001 || true)
    API_URL="http://localhost:${API_PORT_DETECTED:-3001}"
  fi
fi

if [[ -z "${BASE_URL:-}" ]]; then
  if [[ -n "${ADMIN_PORT:-}" ]]; then
    BASE_URL="http://localhost:${ADMIN_PORT}"
  else
    ADMIN_PORT_DETECTED=$(autodetect_port admin 3000 || true)
    BASE_URL="http://localhost:${ADMIN_PORT_DETECTED:-3000}"
  fi
fi
EMAIL="${EMAIL:-admin@example.com}"
PASSWORD="${PASSWORD:-admin123}"

echo "[1/4] health"
curl -fsS "${API_URL}/health" | cat

echo
echo "[2/4] login"
LOGIN_RES=$(curl -sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "${API_URL}/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

STATUS=$(echo "$LOGIN_RES" | sed -n 's/^HTTP_STATUS://p')
BODY=$(echo "$LOGIN_RES" | sed '/^HTTP_STATUS:/d')

if [[ ! "$STATUS" =~ ^2 ]]; then
  echo "login failed (HTTP $STATUS): $BODY" >&2
  echo "Hint: run seed -> docker compose exec api npm run seed:demo" >&2
  exit 1
fi

TOKEN=$(echo "$BODY" | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).access_token')

echo "token: ${TOKEN:0:16}..."

echo
echo "[3/4] me"
curl -fsS "${API_URL}/auth/me" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "[4/6] list agents"
curl -fsS "${API_URL}/agents" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "[5/6] list users"
curl -fsS "${API_URL}/users" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "[6/6] list withdrawal-requests"
curl -fsS "${API_URL}/withdrawal-requests" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "OK. Admin UI should be at: ${BASE_URL}"
