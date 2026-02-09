# PRODUCT_SPEC — crmforfun（Phase 0 逻辑图包）

> 规则：本文件确认“逻辑OK”后，才进入任何会改变业务行为的代码优化。

## 1) 目标（一句话）
做一个“平台后台（Admin/Finance）→ 代理（Normal/Credit）→ 用户”的 CRM 管理系统：支持登录/权限、代理与用户管理、充值订单（ATP）、回调幂等、入账到 ledger、提现审核、以及基础统计面板。

## 2) 范围
- In：后台管理端（Admin UI）+ API + Postgres；本机/内网 docker compose 可一键跑通；支持 seed + smoke。
- Out：公网部署、真实支付密钥管理、C 端 App/前台页面、真实输赢口径（后续再做）。

## 3) 角色与权限矩阵（第一版）
- Admin：全权限（创建代理/用户、审核、配置）
- Finance：查看统计、审核提款/对账相关
- Agent_Normal / Agent_Credit：代理侧（仅看自己用户/订单/账本）

> 待确认：代理端是否需要独立 UI（或仅 API + 后续再加）。

## 4) 核心实体（ER / 数据模型）
- users（role、agent_id）
- agents（type、name）
- deposit_orders（状态机：Created→Paying→Paid→Credited/Failed）
- withdrawal_requests（Requested→Approved→Paid/Rejected）
- ledger_accounts / ledger_entries（余额由汇总得出）
- credit_limits / credit_limit_requests（授信模式）

## 5) 关键流程（状态机）
### 5.1 充值（Normal）
- Created：创建订单（幂等键：clientOrderId 或 ref）
- Paying：调用 ATP 获取二维码/支付信息
- Paid：收到 notify 并验签通过 + 幂等去重
- Credited：写入 ledger_entries（入账）并标记订单已入账

### 5.2 提现
- Requested：提交申请
- Approved/Rejected：财务审核
- Paid：出款完成并记账

## 6) API 契约（高层）
- auth：/auth/login, /auth/me
- admin：/agents, /users, /deposit-orders, /withdrawal-requests, /stats/*
- payments：/payments/atp/*（下单/回调）

## 7) 验收用例（Given/When/Then）
1) Admin 能登录并访问 /agents /users
2) Finance 登录后无法创建 agent，但能查看列表
3) 充值订单重复回调（同 notify）不产生重复入账（幂等）
4) 提现审核：Approved 后才能 Paid；Rejected 不可再 Paid
5) stats 在指定时间范围内能返回稳定结构（字段不漂移）

## 8) 最小 Demo 脚本
- 启动：`API_PORT=3011 ADMIN_PORT=3012 docker compose up -d --build`
- 初始化：`docker compose exec api npm run seed:demo`
- 自测：`API_PORT=3011 ADMIN_PORT=3012 bash scripts/smoke-test.sh`

## 9) 当前已发现的问题（先列，不改代码逻辑前先确认）
- 项目命名与文档大量沿用 bet-crm-demo（会导致验收口径错位）
- WORK_STATE.json 之前指向 bet-crm-demo 里程碑（断点不可用）
- 默认端口 3001/3000 在宿主机常冲突，需要把 API_PORT/ADMIN_PORT 的用法在 README/TESTING 固化

## 需要你确认的 3 个点（决定后续优化方向）
1) 你认为“逻辑不能用”具体指：充值/回调口径？权限/RBAC？账本口径？还是 UI 交互？
2) 代理端是否需要现在就做 UI，还是先保证 API+统计+对账闭环？
3) 统计口径：目前先现金流（入账/出账/净额），真实输赢口径后续做，是否确认？
