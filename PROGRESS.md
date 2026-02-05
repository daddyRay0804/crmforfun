# Progress — bet-crm-demo

> 更新时间：自动（每小时）+ 手动

## 当前里程碑：M0 — 可登录后台 + 账本雏形

### Checklist
- [x] 项目骨架 + docker-compose + git init
- [x] API：NestJS 初始化（健康检查 / swagger）
- [x] Admin：Next.js + Ant Design Pro 初始化（登录页/布局）
- [x] Auth：JWT 登录 + RBAC（Admin/Agent_Normal/Agent_Credit/Finance）
- [x] DB：Postgres + migration 工具落地（node-pg-migrate + init migration）
- [x] Ledger：accounts + ledger_entries（余额由账本汇总）

## 后续里程碑
### M1 — 代理/用户管理
- [x] agents（两类）+ users + 归属关系
  - [x] API：users 创建 + 绑定 agent
  - [x] Admin UI：创建用户/绑定关系（/users）
- [x] 代理视角列表/详情

### M2 — 充值（代理后台）+ ATP 下单
- [x] deposit_orders：创建/状态
- [x] ATP fetchQrcode 封装（签名、请求、解析）
- [x] 回调 notify（验签 + 幂等）
- [x] 入账到 ledger（Paid -> ledger_entries + deposit_orders.Credited）

### M3 — 授信模式
- [ ] credit_limit（人工填写第一次费用）
- [ ] 第二次额度申请（审批流）

### M4 — 提现（人工审核）
- [ ] 提现申请/冻结/审核/出账

## Notes
- 不记录任何密钥/验证码到 git。
