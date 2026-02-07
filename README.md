# bet-crm-demo

Demo CRM (two-level: platform → agent → user) with two agent modes:
- normal (direct top-up via payment orders)
- credit (manual credit limit + manual fee + re-apply workflow)

## 部署（服务器 / 生产）

在服务器上更新代码后：

```bash
docker compose up -d --build
```

- Admin UI: http://<server-ip>:${ADMIN_PORT:-3000}
- API: http://<server-ip>:${API_PORT:-3001}
- Postgres: （默认不对外暴露端口，仅容器内访问）

## 本地开发（Dev）

```bash
docker compose -f docker-compose.dev.yml up
```

- Admin UI: http://localhost:3000
- API: http://localhost:3001
- Postgres: localhost:5432 (crm/crm)
