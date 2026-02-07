#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:${ADMIN_PORT:-3000}}"
API_URL="${API_URL:-http://localhost:${API_PORT:-3001}}"
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

if [[ "$STATUS" != "200" ]]; then
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
