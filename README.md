<p align="center">
  <img src="https://maxspeak.vercel.app/poster.webp" alt="MaxSpeak — AI 语音合成工作台" width="100%" />
</p>

# <picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/MaxSpeak-a78bfa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="><img alt="MaxSpeak" src="https://img.shields.io/badge/MaxSpeak-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="></picture>

# MaxSpeak — AI 语音合成工作台

> **免费 · 开源 · 300+ 音色 · 音色复刻 · 音色设计**
>
> 基于 [MiniMax](https://platform.minimax.io) 新一代语音大模型，提供文本转语音、音色复刻、音色设计一站式解决方案。

[🌐 在线体验](https://maxspeak.vercel.app) · [🚀 一键部署到 Vercel](https://vercel.com/new/clone?repository-url=https://github.com/harlan-zhang/maxspeak)

---

*English version: [README_EN.md](./README_EN.md)*

## 为什么选择 MaxSpeak

| 功能 | 说明 |
|------|------|
| **AI 语音合成** | 文本转语音，支持 9 种情感风格、语速/音高/音色精细调控、副语言标签（叹气/笑声/呼吸等） |
| **AI 配音编排** | 为选区或整稿建议停顿、换气、轻笑和读音，支持片段 A/B 试听、逐条应用和撤销 |
| **音色复刻** | 上传 10 秒音频即可复刻任意音色 — 适合创作者、播客、有声书、无障碍场景 |
| **音色设计** | 用自然语言描述想要的音色，AI 即刻生成 — 「温暖亲切的女声，适合读睡前故事」 |
| **流式 & 同步** | SSE 流式输出实现即时播放，长文本自动切换流式；亦支持同步下载高质量音频 |
| **300+ 系统音色** | 内置中文、英语、日语、韩语、粤语、西班牙语、葡萄牙语、法语等 20+ 语言的预置音色 |

## 快速开始

```bash
git clone https://github.com/harlan-zhang/maxspeak.git
cd maxspeak
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，点击右上角设置图标，粘贴你的 [MiniMax API Key](https://platform.minimax.io)，即可开始使用。

## AI 配音编排

1. 在「设置 → AI 配音编排」按 Key 的签发平台选择 MiniMax 国内站、MiniMax 国际站、OpenAI、DeepSeek 或 OpenRouter，填写文本模型 ID 和 Key。也可以选择「自定义」，填入兼容 OpenAI Chat Completions 的 Base URL（例如 `http://localhost:11434/v1`）和模型 ID。选择「测试连接」可用固定测试内容检查配置。
2. 在「语音合成」输入文案，有选区时分析选区，否则分析整稿。选择自然、短视频口播、讲故事或宣传片旁白风格。打开「允许建议语气词」可获得「嗯」「哎呀」等建议。打开「口播润色与价格读法」可获得措辞建议，例如将促销稿里的 `9.9` 读成「九块九」。宣传片还可对开场、正式标题和片尾提出建议。
3. 查看每条建议的原文位置与理由。用原稿和建议版试听同一片段，选区分析的试听限于选区。勾选后应用。应用润色或价格读法会替换相应的稿件片段。拼音、IPA 或别名写入发音词典，例如「行洪」使用 `xing2 hong2`。修改原稿、语音模型或词典后需要重新分析。应用后可撤销最近一次编排。

文本模型与合成使用各自的 Key。文本 Key 只保存在当前页面会话的内存中，切换服务商或修改 Base URL 会清空，刷新后需重新输入。预设通过本站转发给固定服务商，自定义地址由浏览器直接连接，公网要求 HTTPS，本地 HTTP 受浏览器本地网络访问权限及 CORS 限制。本地服务允许留空 Key，并需允许工作台的来源。预览使用当前 MiniMax 音色和合成配置，A/B 各产生一次同步合成请求。

口播润色默认关闭，改写片段避开阿拉伯数字。价格建议适用于带「元」或紧跟在「只需」「现价」等表述之后的人民币金额，支持 1 到 99.99 元之间的一到两位小数，按原金额计算读法。副语言由 Speech 2.8 HD 和 Turbo 支持。发音词典作用于整稿，因此 AI 仅为原稿内唯一且与手工规则兼容的词语给出可应用的读音。格式与支持范围见 [MiniMax 语音合成文档](https://platform.minimax.io/docs/api-reference/speech-t2a-http.md)。

## 部署

### Vercel（推荐）
一键部署，零配置：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/harlan-zhang/maxspeak)

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
浏览器                    Next.js 服务端                   MiniMax API
  │                           │                              │
  ├─ POST /api/tts/synthesize ──►  POST /v1/t2a_v2 ──►       │
  │                           │    (output_format=hex)       │
  │                           │                              │
  │                           │   ◄── hex 音频数据 ──────────┤
  │                           │                              │
  │                           │   服务端格式检测:              │
  │                           │   ID3/MP3 · RIFF/WAV          │
  │                           │   fLaC/FLAC · OggS/OGG        │
  │                           │   都不是? → PCM → 封装 WAV    │
  │                           │                              │
  │  ◄── binary audio blob ───┤                              │
  │  (Content-Type: audio/*)  │                              │
  │                           │                              │
  ▼                   API Key 由浏览器本地保存并发送到本站代理        ▼
 [blob URL → <audio>]                                    [300+ 音色]
```

- **本地 API Key 模式** — API Key 由用户在浏览器设置页输入，保存在本机 `localStorage`，请求 MiniMax 时会通过本站 Next.js API Routes 代理转发；请只在可信部署上使用
- **服务端格式检测** — 自动识别 5 种音频容器（ID3/MP3、RIFF/WAV、fLaC/FLAC、OggS/OGG、FFxx/MPEG），裸 PCM 自动封装 WAV 头
- **二进制返回** — 服务端始终返回 `Content-Type: audio/*`，客户端 `res.blob()` 单一路径，无 JSON 分支
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

在「音色库」点击「从 API 同步」，可把当前 MiniMax 账号的复刻和设计音色保存到当前浏览器。在「语音合成」的语言筛选中选择「自定义音色」即可使用。音色库按 API Key 和服务器隔离，切换配置会清除当前选中的自定义音色。

升级后，请使用原有 MiniMax 配置同步一次。旧版记录会保留在浏览器里。同步前勾选「同步时恢复旧版试听和提示词」，即可为当前账号返回的同类型、同 ID 音色恢复历史资料。MiniMax 仅在自定义音色成功合成过后返回该音色。

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
│   └── api/            # 8 个 API Route 处理器
├── components/
│   ├── layout/         # 侧边栏、顶栏、主题切换
│   ├── tts/            # 语音合成面板及子控件
│   ├── player/         # 音频播放器（带进度条）
│   ├── clone/          # 音色复刻向导（上传 → 配置 → 试听）
│   ├── design/         # 音色设计（文本描述生成）
│   ├── library/        # 音色库浏览器
│   └── settings/       # 设置弹窗
├── public/             # Logo、海报图等静态资源
└── lib/
    ├── minimax/        # API 客户端、类型定义、常量
    ├── planner/        # AI 编排请求、建议校验与应用
    ├── audio/          # 播放引擎、流解码器、工具函数
    ├── voices/         # 300+ 预置音色、情感标签、语言数据
    └── store/          # Zustand 状态管理
```

## 更新记录与验证

### 1.2.0

- AI 配音编排新增宣传片旁白、可选口播润色和人民币价格读法，并扩充语气词与专业术语读音提示。每条建议均支持试听、逐条应用和撤销。
- 编排回归测试覆盖重复金额定位、既有停顿标记、专业词发音词典和宣传片润色对数字及已有词典规则的保护。

### 1.1.1

- AI 配音编排支持 MiniMax 国内站。国内站和国际站各自使用官方文本接口，并共用 MiniMax 模型参数。`npm test` 覆盖两个预设的请求地址和参数。

### 1.1.0

- 新增 AI 配音编排，支持选区与整稿、三种风格、停顿和读音建议、按需启用语气词、片段 A/B 试听及应用撤销。
- 文本模型配置独立于 MiniMax 合成，支持四个平台预设、自定义公网网关和本地兼容模型。
- 移动端导航改为抽屉，给文案编辑和试听留出完整宽度。
- 新增编排和文本模型连接回归测试。用 `npm test` 验证音色同步、建议校验、原子应用和撤销、固定平台代理和自定义直连，用 `npm run lint` 和 `npm run build` 检查代码和生产构建。

### 1.0.1

- 修复同步后的复刻和设计音色无法在合成选择器中使用的问题。
- 统一复刻、设计和同步的本地音色库，按账号和服务器保存，避免跨标签页写入覆盖。
- 兼容 MiniMax 的分组和列表响应，将业务错误显示为同步失败。

## License

MIT — 自由构建商用项目。使用 [MiniMax API](https://platform.minimax.io) 需遵守其服务条款。
