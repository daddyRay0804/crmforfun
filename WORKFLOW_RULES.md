# Workflow rules — bet-crm-demo

## Goal
Keep progress moving even if the agent is interrupted.

## On every hourly report
1. Read `PROGRESS.md` + this `WORKFLOW_RULES.md`.
2. Compare with `git log -n 5` and current `git status`.
3. Identify the next unchecked item in the current milestone (M0 → M1 → ...).
4. Interruption recovery (anti-duplicate / anti-wrong):
   - Run `git diff` (and quick search) to confirm the target feature/module is not already implemented.
   - If there are half-done changes (dirty working tree), either finish them to a consistent state or revert them before starting new work.
   - If the last work session was interrupted (no new commit while a checklist item is in-progress), re-open that item and continue from the last known state.
5. Pre-push quality gate (must pass before any commit/push that claims “major progress”):
   - `npm -w apps/api run build`
   - `npm -w apps/admin run build`
   - Smoke checks:
     - API: `GET /health` returns 200
   If a build fails, do not push; fix or leave as local WIP.
6. Always end the report with: next 1-3 concrete actions and expected output artifact (file/endpoint/page).

## General dev guardrails
- Never commit secrets. Use `.env` locally; commit `.env.example` only.
- For any external callback (ATP notify), implement signature verification + idempotency.
- For money movement, use ledger entries only (no direct balance mutation).
- Prefer small commits; refactor/fix before stacking new features on broken state.
