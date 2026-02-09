# crmforfun

Demo CRM (two-level: platform → agent → user) with two agent modes:
- normal (direct top-up via payment orders)
- credit (manual credit limit + manual fee + re-apply workflow)

## 部署（服务器 / 生产）

> 端口冲突提示：若宿主机 3000/3001 被占用，可用 `ADMIN_PORT` / `API_PORT` 修改映射端口。
> 例如：`API_PORT=3011 ADMIN_PORT=3012 docker compose up -d --build`

在服务器上更新代码后：

```bash
docker compose up -d --build
```

首次部署或升级后，建议执行一次初始化数据（创建测试账号/测试数据）：

```bash
docker compose exec api npm -w apps/api run seed:demo
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
