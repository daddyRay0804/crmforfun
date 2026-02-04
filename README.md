# bet-crm-demo

Demo CRM (two-level: platform → agent → user) with two agent modes:
- normal (direct top-up via payment orders)
- credit (manual credit limit + manual fee + re-apply workflow)

## Dev

```bash
docker compose up
```

- Admin UI: http://localhost:3000
- API: http://localhost:3001
- Postgres: localhost:5432 (crm/crm)

> Note: apps are scaffolded next.
