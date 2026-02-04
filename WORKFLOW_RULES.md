# Workflow rules — bet-crm-demo

## Goal
Keep progress moving even if the agent is interrupted.

## On every hourly report
1. Read `PROGRESS.md`.
2. Compare with `git log -n 5` and current `git status`.
3. Identify the next unchecked item in the current milestone (M0 → M1 → ...).
4. If the last work session was interrupted (e.g., no new commits in last hour while checklist item is in-progress), re-open that item and continue from the last known state.
5. Always end the report with: next 1-2 concrete actions and expected output artifact (file/endpoint/page).

## General dev guardrails
- Never commit secrets. Use `.env` locally; commit `.env.example` only.
- For any external callback (ATP notify), implement signature verification + idempotency.
- For money movement, use ledger entries only (no direct balance mutation).
- After finishing each milestone item: run quick smoke test and note result in the hourly report.
