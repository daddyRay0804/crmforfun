# TESTING — bet-crm-demo

> 目标：给“人类可复制”的最小 smoke 流程，用于每次改 Auth/RBAC/DB 以后快速回归。

## 0. 前置
- Node / npm 已安装
- Docker 已安装

## 1. 启动 Postgres

在仓库根目录：

```bash
docker compose up -d
```

检查 DB 是否起来：

```bash
docker compose ps
```

## 2. 初始化数据库（migrations）

API 使用 `DATABASE_URL`。

```bash
export DATABASE_URL="postgres://crm:crm@localhost:5432/crm"

npm -w apps/api run migrate:up
```

> 预期：migrations 执行成功（001_init / 002_ledger / 003_agents）。

## 3. 启动 API / Admin

开 2 个终端（或用你习惯的方式）：

### Terminal A — API
```bash
export DATABASE_URL="postgres://crm:crm@localhost:5432/crm"

npm -w apps/api run dev
```

默认：`http://localhost:3001`

### Terminal B — Admin
```bash
export NEXT_PUBLIC_API_BASE="http://localhost:3001"

npm -w apps/admin run dev
```

默认：`http://localhost:3000`

## 4. Smoke 流程（推荐）

### 4.1 创建初始 Admin 用户（建议：用 seed 脚本）

```bash
export DATABASE_URL="postgres://crm:crm@localhost:5432/crm"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="admin123"

npm -w apps/api run seed:admin
```

> 说明：只写入你本机 DB，不会提交任何密钥。重复执行是幂等的。

### 4.2 Admin UI 操作

1) 打开 `http://localhost:3000/agents`
2) 用 `admin@example.com / admin123` 登录（获取 token）
3) 创建一个 agent（Normal 或 Credit）
4) 打开 `http://localhost:3000/users`
5) 刷新（会加载 agents + users）
6) 创建 user（role=Agent_Normal/Agent_Credit 任意）并绑定 agent
7) 在用户列表里修改 user 的 agent 绑定并保存

## 5. API 层 Smoke（curl 版，可选）

> 下面假设你已经有 admin 用户。

### Login
```bash
TOKEN=$(curl -s \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  http://localhost:3001/auth/login | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).access_token")

echo "$TOKEN" | head -c 24; echo
```

### Create agent
```bash
curl -s -X POST \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Agent A","type":"Normal"}' \
  http://localhost:3001/agents | cat
```

### List agents
```bash
curl -s \
  -H "authorization: Bearer $TOKEN" \
  http://localhost:3001/agents | cat
```

### Create user
```bash
curl -s -X POST \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"email":"u1@example.com","password":"u1pass","role":"Agent_Normal"}' \
  http://localhost:3001/users | cat
```

### List users
```bash
curl -s \
  -H "authorization: Bearer $TOKEN" \
  http://localhost:3001/users | cat
```

## 6. 回归规则（我后续每次更新都会遵守）

- 改 DB migration / Auth / RBAC / Users/Agents 任一模块：
  - 必跑：migrate + `npm -w apps/api run build` + `npm -w apps/admin run build`
  - 必做：Admin UI smoke（登录→创建 agent→创建 user→绑定）

## 7. 常见问题

- Admin UI 调不到 API
  - 检查 `NEXT_PUBLIC_API_BASE`
  - 检查 API 是否在 3001
- 401/403
  - token 是否过期/是否带了 `authorization: Bearer ...`
  - 角色是否满足接口的 `@Roles(...)`
