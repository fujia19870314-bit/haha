# TODOs / Known Limitations

## MVP Phase 2 (Current — 0.1.0.0)

### Known Limitations
- **情绪分析**：后端 `emotionTag` 目前直接使用用户选择的 mood，未通过 LLM 做独立情绪分析。`EMOTION_ANALYSIS_PROMPT` 已预留但未接入。
- **危机检测**：当前使用关键词匹配 + 语义评分。`CRISIS_DETECTION_PROMPT` 为未来 LLM-based 检测预留。
- **白噪音**：设置页播放器为 MVP 模拟版，实际音频文件待接入。
- **PDF 导出**：`generate-pdf` 云函数返回模拟下载链接，真实 PDF 生成待实现。
- **咨询师数据**：`get-resources` 返回静态数据，需接入真实咨询师 API。

### Next Phase (0.2.0.0)
- [ ] 接入 LLM 情绪分析（使用 `EMOTION_ANALYSIS_PROMPT`）
- [ ] 接入 LLM 危机检测（使用 `CRISIS_DETECTION_PROMPT`）
- [ ] 真实 PDF 生成与下载
- [ ] 白噪音真实音频接入
- [ ] 咨询师资源动态化
- [ ] 后端单元测试（当前仅前端有测试覆盖）
- [ ] E2E 测试（Playwright / 微信小程序自动化）
