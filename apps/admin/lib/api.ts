export function getApiBase() {
  // same-origin proxy; next.config.js rewrites /api -> http://api:3001
  return process.env.NEXT_PUBLIC_API_BASE ?? '/api';
}
