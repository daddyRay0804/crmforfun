# Progress — crmforfun

> 说明：本仓库历史上沿用过 bet-crm-demo 的命名与文档。现在开始按“DEV_SKILL：Phase 0 先确认→小步自测→再扩展”规范化。

## 当前阶段：规范化（文档/口径/自测）

### 已验证（本机 compose + seed + smoke）
- [x] docker compose 可启动（端口可通过 API_PORT/ADMIN_PORT 避免冲突）
- [x] `npm run seed:demo` 可生成测试账号/代理/用户/提现申请
- [x] `scripts/smoke-test.sh` 通过（health/login/me/list agents/users/withdrawals）

### 需要完成（Phase 0）
- [x] 产出逻辑图包：`PRODUCT_SPEC.md`
- [ ] 菠菜爸爸确认："逻辑OK"（范围/口径/验收用例）

## 交付里程碑（以“验收口径”为准）

### M0 — 登录/权限 + 基础管理端（可用）
- [x] 登录页 + AuthGate
- [x] RBAC（Admin/Finance/Agent_Normal/Agent_Credit）
- [x] Admin UI：agents/users/withdrawals 列表页可访问
- [ ] 错误提示/状态标签/枚举中文化统一（UI一致性）

### M1 — 代理/用户管理（可验收）
- [x] API：agents/users 基础 CRUD（以当前实现为准）
- [ ] 验收用例补齐（权限/边界/幂等）
- [ ] smoke 扩展：create user / create withdrawal 的 API 断言

### M2 — 充值订单（ATP）+ 回调幂等（可验收）
- [ ] 以 PRODUCT_SPEC 的状态机为准，补齐：幂等键、重复回调不重复入账、对账字段
- [ ] 加入最小回归测试（至少脚本级 smoke 或单元测试覆盖 notify 幂等）

### M3 — 授信模式（可验收）
- [ ] 明确授信额度/申请/审批流的口径与验收

### M4 — 提现审核（可验收）
- [ ] 明确提现状态机与记账口径（冻结/审核/出账）

## Notes
- 不记录任何密钥/验证码到 git。
- 端口冲突：推荐启动示例：`API_PORT=3011 ADMIN_PORT=3012 docker compose up -d --build`
