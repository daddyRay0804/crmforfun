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
TOKEN=$(curl -fsS -X POST "${API_URL}/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" | \
  node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).access_token')

echo "token: ${TOKEN:0:16}..."

echo
echo "[3/4] me"
curl -fsS "${API_URL}/auth/me" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "[4/4] list agents"
curl -fsS "${API_URL}/agents" -H "authorization: Bearer ${TOKEN}" | cat

echo
echo "OK. Admin UI should be at: ${BASE_URL}"
