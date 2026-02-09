# ARCHITECTURE — crmforfun

> 目标：用“平台(Admin/Finance) → 代理(两模式) → 用户”的最小 CRM demo，包含 Auth/RBAC + Postgres + Ledger（余额由账本汇总），后续接入充值/回调占位。

## 1. 运行单元（Runtime Units）

- **Admin UI**（Next.js）
  - 目录：`apps/admin`
  - 当前页面：
    - `/` 首页（入口）
    - `/agents` 代理列表/创建
    - `/users` 用户列表/创建/绑定代理
  - 通过 `NEXT_PUBLIC_API_BASE` 调用 API（默认 `http://localhost:3001`）

- **API**（NestJS）
  - 目录：`apps/api`
  - 主要模块：
    - `AuthModule`：登录 / JWT
    - `AgentsModule`：代理 CRUD（目前仅 Admin 可创建，Admin/Finance 可列表）
    - `UsersAdminModule`：用户管理（Admin/Finance 列表；Admin 创建/绑定 agent）

- **DB**（Postgres）
  - 由 `docker-compose.yml` 启动
  - Migration：`apps/api/migrations/*.js`（`node-pg-migrate`）

## 2. 权限模型（RBAC）

### Roles（枚举）
- `Admin`
- `Finance`
- `Agent_Normal`
- `Agent_Credit`

> 当前 API 的路由权限：
- `POST /auth/login`：公开
- `GET /auth/me`：需要 JWT
- `GET /auth/admin/ping`：Admin
- `GET /agents`：Admin / Finance
- `POST /agents`：Admin
- `GET /users`：Admin / Finance
- `POST /users`：Admin
- `PATCH /users/:id/agent`：Admin

## 3. 数据模型（Schema）

### users
- `id uuid PK`
- `email text unique`
- `password_hash text`（pgcrypto）
- `role user_role`
- `agent_id uuid nullable -> agents.id`
- `created_at / updated_at`

### agents
- `id uuid PK`
- `type agent_type (Normal|Credit)`
- `name text`
- `created_at / updated_at`

### ledger（M0 账本雏形）
> 核心原则：**余额不落字段**，由 ledger_entries 汇总。

- `accounts`
  - `id uuid PK`
  - `owner_user_id uuid -> users.id`
  - `currency text default 'CNY'`
  - `name text default 'main'`
- `ledger_entries`
  - `id uuid PK`
  - `account_id uuid -> accounts.id`
  - `amount numeric(18,2)`（正=入账，负=出账）
  - `entry_type ledger_entry_type`
  - `ref_type / ref_id / memo`
  - `created_at`

## 4. 关键数据流（Data Flows）

### 4.1 登录（Admin UI → API）
1) Admin UI 调用 `POST /auth/login`（email/password）
2) API 校验 DB `users.password_hash`
3) 返回 `access_token`（JWT）
4) Admin UI 存储 token 到 localStorage（key: `crmforfun_token`）

### 4.2 创建代理（Admin）
1) Admin UI `/agents` 调用 `POST /agents`
2) 写入 `agents`
3) 刷新 `GET /agents`

### 4.3 创建用户 + 绑定代理（Admin）
1) Admin UI `/users` 调用 `POST /users`（可选 agentId）
2) 写入 `users`（role + agent_id）
3) 需要时调用 `PATCH /users/:id/agent` 更新绑定关系

## 5. 目录结构（重点部分）

```
projects/crmforfun/
  apps/
    api/
      src/
        auth/
        agents/
        users/
        db/
      migrations/
    admin/
      pages/
        index.tsx
        agents.tsx
        users.tsx
  docker-compose.yml
  PROGRESS.md
  WORKFLOW_RULES.md
```

## 6. 现状与缺口（对齐里程碑）

- ✅ M1（agents/users + Admin UI 管理）已落地
- ⏳ M2（充值订单 + ATP 下单占位 + 回调/幂等 + 入账到 ledger）未开始
- ⏳ 代理视角页面/接口（仅看自己用户、自己账本）未开始

> 注：该文件只描述结构与数据流，不包含任何密钥/验证码/真实支付参数。