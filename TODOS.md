# TODOs / Known Limitations

> 哀伤日记 - AI 哀伤引导日记小程序
> 最后更新：2026-04-29

---

## 状态图例

- [x] 已完成
- [~] 进行中 / 部分完成
- [ ] 待开始
- [!] 阻塞 / 有依赖

---

## Phase 1：MVP 核心功能（v0.1.0）

### 前端 - 微信小程序

#### 已完成

- [x] **uni-app Vue3 + TypeScript 基础架构**
- [x] **页面框架**：首页、写日记、日记回应、引导页、历史、日历、导出、设置、危机帮助、订阅
- [x] **温暖纸质感 UI 设计系统**
  - CSS 变量主题（米色背景 `#F5F0EB`、墨绿主色 `#4A6352`）
  - `page` 选择器兼容微信小程序（`:root` 在微信中不生效）
- [x] **微信小程序兼容性**
  - JS ES5 转译（vite babel 插件 + post-build 脚本双重保障）
  - `project.config.json` 配置 `libVersion: 2.30.0`
  - 开启 `enhance: true`
  - 开启 `minified: true`（微信官方性能优化要求第8、10条）
  - `lazyCodeLoading: requiredComponents`（微信官方要求第12条）
- [x] **TabBar**：今日、书写、回顾、更多
- [x] **自定义导航栏**：统一风格，危机帮助按钮
- [x] **情绪选择器**：9种情绪标签（悲伤、愤怒、内疚、思念、平静、混乱、温暖、焦虑、麻木）
- [x] **日记书写**：文本输入、字数统计、情绪绑定
- [x] **引导页**：3步 onboarding（关系、时间、支持需求）
- [x] **数据存储**：`uni.setStorageSync` 本地存储（引导数据、日记历史）
- [x] **白噪音播放器 UI**（MVP 模拟版，仅UI和计时器）
- [x] **微信支付接入 UI**
- [x] **专业支持页面**：静态咨询师列表 + 城市筛选
- [x] **危机帮助页面**：心理援助热线列表 + 一键拨号
- [x] **历史回顾列表**：按时间排序，情绪标签展示
- [x] **情绪日历**：月视图 + 情绪色点 + 月度统计
- [x] **日记详情页**：点击历史列表进入单篇日记详情，展示完整内容和 AI 回应
- [x] **前端动画**：页面入场动画（fadeInUp、fadeInDown）、情绪标签选中动效、卡片入场动画
- [x] **空状态优化**：更温馨的插画式空状态 + 引导用户写第一篇日记
- [x] **骨架屏**：详情页骨架屏加载态

#### 已知限制

- [~] **图片资源**：tabbar 图标使用静态 PNG，需确认实际尺寸适配
- [ ] **真机测试**：目前仅在开发者工具模拟器中验证，需真机测试
- [ ] **iOS/Android 样式差异**：部分样式可能在不同平台有细微差异

### 后端 - 云函数

#### 已完成

- [x] **架构设计**：云函数 + PostgreSQL + LLM Provider
- [x] **数据库 Schema**：用户表、日记表、AI回应用、危机日志、订阅表、支付订单表
- [x] **日记提交**：`submit-journal` 云函数
- [x] **AI 回应**：接入通义千问（Qwen）LLM Provider
- [x] **系统提示词**：哀伤见证者角色、三条禁令、危机处理指引
- [x] **危机检测**：关键词匹配 + LLM 双模式（`crisis-detector.ts`）
- [x] **情绪分析**：LLM 独立情绪识别（`submit-journal.ts` 中 `analyzeEmotion`）
- [x] **内容安全**：敏感词过滤 + AI 响应后处理（`content-filter.ts`）
- [x] **统一错误处理**：AppError 错误码体系 + 用户友好错误消息（`error-handler.ts`）
- [x] **危机热线**：静态热线列表
- [x] **每日引导**：`get-daily-prompt` 返回主题化提示
- [x] **用户认证**：微信登录（`user-auth.ts`）
- [x] **微信支付**：`wechat-pay.ts` 订单创建
- [x] **PDF 导出**：`generate-pdf.ts` 云函数（返回模拟下载链接）
- [x] **咨询师资源**：`get-resources.ts` 返回静态数据
- [x] **数据加密**：日记内容加密存储（`encryption.ts`）
- [x] **响应校验**：禁止"感谢分享""我懂你的感受""作为人工智能"等模板化表达

#### 已知限制

- [ ] **用户唯一标识**：`userId` 目前为空字符串或本地生成，未绑定真实 openid
- [ ] **支付回调**：缺少微信支付异步通知处理

### 测试

- [x] **前端单元测试**：App.vue 基础测试
- [x] **后端单元测试**：全部云函数、lib 模块覆盖
  - crisis-detector, encryption, generate-pdf, get-daily-prompt, get-resources
  - llm-provider, qwen-provider, submit-journal, system-prompt, user-auth
  - wechat-api, wechat-pay

---

## Phase 2：功能增强（v0.2.0）

### 高优先级

- [x] **接入 LLM 情绪分析**
  - 使用 `EMOTION_ANALYSIS_PROMPT` 对日记内容进行独立情绪识别
  - 替换前端自报情绪，提升情绪日历准确性
  - 涉及文件：`backend/lib/system-prompt.ts`, `backend/functions/submit-journal.ts`

- [x] **接入 LLM 危机检测**
  - 使用 `CRISIS_DETECTION_PROMPT` 辅助关键词匹配，形成双模式检测
  - 提升检测准确率，减少误报漏报
  - 涉及文件：`backend/lib/crisis-detector.ts`, `backend/functions/submit-journal.ts`

- [ ] **真实 PDF 生成**
  - `generate-pdf` 云函数返回真实 PDF 下载链接
  - 技术选型：PDFKit / Puppeteer / 腾讯云文档转换
  - 涉及文件：`backend/functions/generate-pdf.ts`

- [ ] **微信登录完整实现**
  - 前端获取 `wx.login` code，后端换取 openid
  - 用户数据与后端用户表绑定
  - 涉及文件：`backend/functions/user-auth.ts`, `frontend/src/services/api.ts`

### 中优先级

- [ ] **白噪音真实音频接入**
  - 接入 CDN 音频文件（雨声、风声、海浪、森林）
  - 微信小程序背景音频播放 `BackgroundAudioManager`
  - 涉及文件：`frontend/src/pages/settings/index.vue`

- [ ] **咨询师资源动态化**
  - `get-resources` 接入真实咨询师数据库/API
  - 支持按城市、专长、在线状态筛选
  - 涉及文件：`backend/functions/get-resources.ts`

- [ ] **支付回调处理**
  - 微信支付异步通知处理
  - 订单状态同步到数据库
  - 涉及文件：`backend/functions/wechat-pay.ts`

- [ ] **订阅状态校验**
  - 每次打开页面校验订阅是否过期
  - 未订阅用户限制部分功能（如无限次日记）
  - 涉及文件：`frontend/src/pages/home/index.vue`, `frontend/src/pages/journal/write.vue`

### 低优先级

- [x] **日记详情页**
  - 点击历史列表进入单篇日记详情
  - 展示完整日记内容和 AI 回应
  - 涉及文件：新增 `frontend/src/pages/journal/detail.vue`

- [ ] **日记编辑与删除**
  - 支持修改已提交日记
  - 支持删除日记（软删除，保留30天）

- [ ] **数据备份与恢复**
  - 云端备份本地日记数据
  - 换机/重装恢复数据

---

## Phase 3：体验优化（v0.3.0）

### 前端体验

- [x] **动画与过渡**
  - 页面切换动画
  - 情绪标签选中动画
  - 卡片入场动画

- [~] **骨架屏 / 加载状态**
  - 详情页骨架屏已完成
  - 首页加载骨架屏待补充
  - 历史列表加载占位待补充

- [x] **空状态优化**
  - 更温馨的插画式空状态
  - 引导用户写第一篇日记

- [ ] **深色模式**
  - 系统级深色模式适配
  - 护眼夜间阅读模式

- [ ] **字体加载优化**
  - 衬线字体（Noto Serif SC）按需加载
  - 字体文件压缩 / CDN 加速

### 后端性能

- [ ] **API 响应缓存**
  - 每日引导缓存（24小时）
  - 咨询师列表缓存（按城市）

- [ ] **数据库连接池优化**
  - 云函数冷启动优化
  - 连接复用

- [ ] **LLM 调用优化**
  - 响应流式输出（SSE）
  - 超时重试机制
  - 降级到备用模型

---

## Phase 4：质量与合规（v0.4.0）

### 测试

- [ ] **前端 E2E 测试**
  - 微信小程序自动化测试（miniprogram-automator）
  - 核心用户流程：引导 → 写日记 → 查看回应 → 查看历史

- [ ] **后端集成测试**
  - 云函数端到端测试
  - 数据库事务测试

- [ ] **性能测试**
  - 首屏加载时间 < 2s
  - LLM 响应时间 < 5s（95分位）

### 合规与安全

- [ ] **PIPL 合规审计**
  - 个人信息处理合规性检查
  - 隐私政策页面
  - 用户数据导出/删除功能

- [x] **内容安全**
  - 日记内容敏感词过滤（`content-filter.ts`）
  - AI 响应内容审核（`filterAIResponse`）
  - 图片上传安全校验（待补充）

- [ ] **HTTPS 与数据加密**
  - 传输层 TLS 1.3
  - 数据库字段加密审计

---

## 技术债务

- [~] **CSS 变量在微信小程序中的限制**
  - 当前方案：`:root` + `page` 双定义
  - 长期方案：考虑使用 SCSS 预编译，避免运行时兼容问题

- [~] **ES5 转译双保险**
  - 当前方案：vite babel 插件 + post-build 脚本
  - 长期方案：评估 uni-app 官方是否已解决此问题，简化构建流程

- [ ] **前端状态管理**
  - 目前使用 ref + localStorage，数据分散
  - 长期：引入 Pinia 或轻量级状态管理

- [x] **后端错误处理**
  - 已统一：AppError 错误码体系 + 用户友好错误消息（`error-handler.ts`）
  - 全部云函数已接入

---

## 参考链接

- [小程序性能优化指南](https://developers.weixin.qq.com/community/develop/doc/00040e5a0846706e893dcc24256009)
- [微信小程序分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html)
- [微信小程序组件按需注入](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/lazyload.html)
