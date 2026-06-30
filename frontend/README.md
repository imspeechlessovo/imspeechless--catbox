# 作者回归倒计时留言站

一个优雅、简洁、有仪式感的个人倒计时和粉丝留言网站。

## 项目背景

猫箱 App 创作者账号解封倒计时页面。访客可查看倒计时，通过答题门禁后进入留言墙留言。作者可通过专属后台管理留言和答题问题。

**解封时间：2026年07月11日 15:57:15（Asia/Shanghai）**

## 技术栈

**前端**
- Vue 3 + TypeScript
- Vite 6
- Vue Router 4
- Pinia 2
- Tailwind CSS 4

**后端**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- bcryptjs（密码/答案哈希）
- JWT + HttpOnly Cookie 鉴权
- express-rate-limit（限流）

## 项目结构

```
maoxiang-countdown/
├── frontend/           # Vue 3 前端
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 通用组件
│   │   ├── stores/     # Pinia 状态管理
│   │   ├── router/     # 路由配置
│   │   ├── api/        # API 封装
│   │   └── styles/     # 全局样式
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/            # Express 后端
│   ├── src/
│   │   ├── auth/       # 鉴权中间件
│   │   ├── modules/    # 业务模块（countdown, gate, messages, author）
│   │   ├── config.ts   # 配置
│   │   ├── prisma.ts   # Prisma 客户端
│   │   └── main.ts     # 入口
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── .env.example
│   └── package.json
└── README.md
```

## 本地启动步骤

### 前置要求

- Node.js >= 18
- PostgreSQL 数据库
- npm 或 pnpm

### 1. 创建数据库

```sql
CREATE DATABASE maoxiang_countdown;
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/maoxiang_countdown"
JWT_SECRET="随机生成一个至少32位的字符串"
COOKIE_SECRET="随机生成另一个字符串"
AUTHOR_USERNAME="你的作者用户名"
AUTHOR_PASSWORD="你的作者密码"
AUTHOR_DISPLAY_NAME="你的显示名称"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

### 3. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端（新开终端）
cd frontend
npm install
```

### 4. 运行数据库迁移

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. 运行种子数据

```bash
cd backend
npm run prisma:seed
```

这会：
- 创建默认答题问题（可后续在后台修改）
- 根据 `.env` 中的配置创建作者账号

### 6. 启动项目

```bash
# 终端 1：启动后端（默认 http://localhost:3000）
cd backend
npm run dev

# 终端 2：启动前端（默认 http://localhost:5173）
cd frontend
npm run dev
```

访问 http://localhost:5173 即可看到网站。

## 页面路由

| 路由 | 说明 | 权限 |
|------|------|------|
| `/` | 首页倒计时 | 公开 |
| `/gate` | 答题门禁 | 公开 |
| `/messages` | 留言墙 | 答题通过 or 作者登录 |
| `/author/login` | 作者登录 | 公开 |
| `/author/dashboard` | 作者后台 | 仅作者 |

## API 接口

### 公共

- `GET /api/countdown` - 获取释放时间和服务器时间
- `GET /api/questions` - 获取启用问题列表（不含答案）
- `POST /api/gate/verify` - 提交答案验证
- `GET /api/auth/status` - 获取当前认证状态

### 留言

- `GET /api/messages` - 获取留言列表
- `POST /api/messages` - 提交留言

### 作者

- `POST /api/author/login` - 作者登录
- `POST /api/author/logout` - 作者退出
- `GET /api/author/messages` - 获取作者留言列表
- `POST /api/author/messages` - 创建作者留言
- `PATCH /api/author/messages/:id` - 更新作者留言
- `DELETE /api/author/messages/:id` - 删除作者留言
- `GET /api/author/visitor-messages` - 获取访客留言列表
- `PATCH /api/author/visitor-messages/:id` - 管理访客留言
- `DELETE /api/author/visitor-messages/:id` - 删除访客留言
- `GET /api/author/questions` - 获取问题列表
- `POST /api/author/questions` - 创建问题
- `PATCH /api/author/questions/:id` - 更新问题
- `DELETE /api/author/questions/:id` - 删除问题

## 安全机制

- ✅ 答案使用 bcrypt 哈希存储，从不明文
- ✅ 作者密码 bcrypt 哈希存储
- ✅ HttpOnly Cookie 鉴权（visitor_token / author_token）
- ✅ SameSite=Lax，生产环境 Secure=true
- ✅ 后端严格校验所有输入（长度、内容）
- ✅ 基础限流（答题验证 10次/分钟，登录 5次/分钟）
- ✅ 前端不使用 v-html，后端对输入做 sanitize
- ✅ CORS 白名单配置
- ✅ IP 哈希记录，不存储原始 IP
- ✅ 密钥通过环境变量管理

## 生产部署建议

### 前端构建

```bash
cd frontend
npm run build
# 产出在 frontend/dist/
```

### 后端构建

```bash
cd backend
npm run build
# 产出在 backend/dist/
```

### 部署注意事项

1. 设置 `NODE_ENV=production`
2. 使用强随机 `JWT_SECRET` 和 `COOKIE_SECRET`
3. 配置前端构建产物由 Nginx 托管
4. 后端使用 PM2 或 Docker 运行
5. 开启 HTTPS，确保 Cookie secure 生效
6. 配置 `FRONTEND_URL` 为实际域名
7. PostgreSQL 使用独立服务器或云数据库

### Docker 示例（简化）

```dockerfile
# 后端 Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/dist ./dist
COPY backend/prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## 常见问题

**Q: 如何修改答题问题？**
A: 作者登录后进入后台 → 答题问题标签页，可增删改问题。

**Q: 如何修改倒计时时间？**
A: 编辑 `backend/src/config.ts` 中的 `releaseTime`。

**Q: 种子数据跑完后如何重置？**
A: `npx prisma migrate reset` 会清空数据库并重新运行迁移和种子。

**Q: 忘记作者密码？**
A: 修改 `.env` 中的 `AUTHOR_PASSWORD`，然后重新运行 `npm run prisma:seed`。
