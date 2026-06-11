# <picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/MaxSpeak-a78bfa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="><img alt="MaxSpeak" src="https://img.shields.io/badge/MaxSpeak-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="></picture>

# MaxSpeak — AI 语音合成工作台

> **免费 · 开源 · 300+ 音色 · 音色复刻 · 音色设计**
>
> 基于 [MiniMax](https://platform.minimax.io) 新一代语音大模型，提供文本转语音、音色复刻、音色设计一站式解决方案。

[在线体验](#) · [部署到 Vercel](https://vercel.com/new) · [Cloudflare Pages](#)

---

*English version: [README_EN.md](./README_EN.md)*

## 为什么选择 MaxSpeak

| 功能 | 说明 |
|------|------|
| **AI 语音合成** | 文本转语音，支持 9 种情感风格、语速/音高/音色精细调控、副语言标签（叹气/笑声/呼吸等） |
| **音色复刻** | 上传 10 秒音频即可复刻任意音色 — 适合创作者、播客、有声书、无障碍场景 |
| **音色设计** | 用自然语言描述想要的音色，AI 即刻生成 — 「温暖亲切的女声，适合读睡前故事」 |
| **流式 & 同步** | SSE 流式输出实现即时播放，长文本自动切换流式；亦支持同步下载高质量音频 |
| **300+ 系统音色** | 内置中文、英语、日语、韩语、粤语、西班牙语、葡萄牙语、法语等 20+ 语言的预置音色 |

## 快速开始

```bash
git clone https://github.com/your-username/maxspeak.git
cd maxspeak
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，点击右上角设置图标，粘贴你的 [MiniMax API Key](https://platform.minimax.io)，即可开始使用。

## 部署

### Vercel（推荐）
一键部署，零配置：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Cloudflare Pages
```bash
npm install -D @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

> **注意：** Cloudflare Pages 以静态模式部署，API Routes 不可用。如需完整功能请使用 Vercel。

## 技术栈

- **框架** — Next.js 14 (App Router) + TypeScript
- **UI** — React 18 + Tailwind CSS + lucide-react 图标
- **状态管理** — Zustand（持久化至 localStorage）
- **音频** — Web Audio API + 原生 `<audio>` 元素，跨浏览器兼容
- **API 代理** — Next.js API Routes 代理 MiniMax TTS、音色复刻和音色设计接口

## 架构 — MiniMax API 代理层

```
浏览器                    Next.js 服务端                MiniMax API
  │                           │                            │
  ├─ POST /api/tts/synthesize ──►  POST /v1/t2a_v2 ──►    ┌─ 音频 CDN URL
  │                           │                            │──► hex 音频数据
  │                           │   ◄── 服务端 fetch CDN ──┤
  │  ◄── raw audio blob ─────┤                            │
  │                           │                            │
  ▼                    API Key 全程仅服务端可见               ▼
 [blob URL → <audio>]                                  [300+ 音色]
```

- **API Key 不会泄露到浏览器** — 所有 MiniMax 请求经 Next.js 服务端路由代理
- **CDN 音频由服务端抓取**并以同源 blob 返回，消除跨域问题
- 流式合成使用 SSE 透传 + 实时 chunk 解码

## 支持的语言与音色

| 语言 | 音色数量 |
|------|---------|
| 中文（普通话） | 34 — 可靠高管、新闻主播、暖心闺蜜、可爱精灵 等 |
| English | 45 — Expressive Narrator、Radiant Girl、Magnetic Voiced Man 等 |
| 한국어 (韩语) | 49 |
| 日本語 (日语) | 15 |
| 粵語 (粤语) | 6 |
| Español (西班牙语) | 12+ |
| Português (葡萄牙语) | 10+ |
| Français, Deutsch, Русский, Italiano, Nederlands 等 | 各 3–8 个 |

完整列表见 `lib/voices/preset-voices.ts`。

## 音频功能详解

### 情感风格
😊 开心 · 😢 悲伤 · 😠 愤怒 · 😨 恐惧 · 🤢 厌恶 · 😲 惊讶 · 😐 中性 · 💬 流畅 · 🤫 耳语

### 副语言标签（`speech-2.8` 系列专用）
`(sighs)` `(laughs)` `(chuckle)` `(breath)` `(pant)` `(gasps)` `(sniffs)` `(crying)` 等 22 种

### 声音修饰
音高偏移、强度、音色、预设音效（空旷回音、电话、收音机、扩音器）

### 音频设置
MP3 / WAV / FLAC / PCM · 8–44.1 kHz · 64–320 kbps · 单声道/立体声

### 发音词典
中文声调标注（`(cao3)(di1)`）、英文发音映射（`Omg/Oh my god`）

## 费用说明

MaxSpeak 本身免费开源。MiniMax API 按量计费：

| 项目 | 费用 |
|------|------|
| 语音合成 | ¥2.0–3.5 / 万字符 |
| 音色复刻 | ¥9.9 / 音色（首次使用扣费） |
| 音色设计预览 | $30 / 百万字符 |

详见 [MiniMax 语音定价](https://platform.minimax.io/docs/guides/pricing-speech)。

## 项目结构

```
maxspeak/
├── app/
│   ├── layout.tsx      # 布局 + SEO 元数据
│   ├── page.tsx        # 主页面（标签页路由）
│   └── api/            # 6 个 API Route 处理器
├── components/
│   ├── layout/         # 侧边栏、顶栏、主题切换
│   ├── tts/            # 语音合成面板及子控件
│   ├── player/         # 音频播放器（带进度条）
│   ├── clone/          # 音色复刻向导（上传 → 配置 → 试听）
│   ├── design/         # 音色设计（文本描述生成）
│   ├── library/        # 音色库浏览器
│   └── settings/       # 设置弹窗
└── lib/
    ├── minimax/        # API 客户端、类型定义、常量
    ├── audio/          # 播放引擎、流解码器、工具函数
    ├── voices/         # 300+ 预置音色、情感标签、语言数据
    └── store/          # Zustand 状态管理
```

## License

MIT — 自由构建商用项目。使用 [MiniMax API](https://platform.minimax.io) 需遵守其服务条款。
