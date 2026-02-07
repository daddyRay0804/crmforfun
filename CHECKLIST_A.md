# 工作 Checklist（A 方案）— 登录/权限/全站中文

目标：把当前 admin 从 demo 形态调整为“后台管理系统”的最小可用版本（M0），并形成可复用的开发-汇报-自测机制。

## A0 — 工作流与汇报机制
- [x] 建立 30 分钟汇报提醒（OpenClaw cron）
- [ ] 每次汇报模板固定：
  - 已完成（含 commit）
  - 当前进行中
  - 阻塞/风险
  - 下一步（30 分钟内可交付的点）
- [ ] 每次改动遵循：小步提交（可回滚）→ 自动 smoke test → 再 push

## A1 — 登录/鉴权（前端）
- [x] 新增 `/login` 页面
- [x] 统一 token 存取（localStorage）
- [x] AuthGate：未登录/失效自动跳转登录页
- [x] 顶栏展示当前用户 + 退出登录
- [ ] 统一错误提示格式（避免散落不同样式）

## A2 — API 访问策略（线上可用）
- [x] Next rewrite：`/api/*` → `http://api:3001/*`
- [x] 前端默认 API Base 改为 `/api`（同源）
- [ ] README 补充：域名部署/反代（Nginx）推荐写法

## A3 — 全站中文化（第一轮）
- [x] 菜单/布局中文
- [x] 仪表盘标题中文
- [x] 代理/用户/提现页面主要按钮与表头中文
- [ ] 状态枚举（如 deposit/withdrawal 状态）全部中文 + 标签色彩
- [ ] 所有 error message 统一中文 + 给出操作建议

## A4 — 测试账号/测试数据
- [x] API：`seed:demo` 脚本（创建 admin/finance/agent 用户 + 代理 + 部分订单/提现）
- [ ] 在 README/部署文档中固化初始化步骤

## A5 — 自测脚本（反复 review）
- [x] `scripts/smoke-test.sh`：health → login → me → list agents
- [ ] 增加：users 列表/创建、withdrawal 列表/创建 的 API smoke
- [ ] 每次 push 前本地跑一遍 smoke（CI 未来可加）
