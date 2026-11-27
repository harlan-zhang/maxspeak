<p align="center">
  <img src="https://maxspeak.vercel.app/poster.webp" alt="MaxSpeak — AI Text to Speech Studio" width="100%" />
</p>

# <picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/MaxSpeak-a78bfa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="><img alt="MaxSpeak" src="https://img.shields.io/badge/MaxSpeak-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM3YxOGgxOE0yIDlsOCA4bDQtNCIvPjxwYXRoIGQ9Ik0yMiA5djEyTTIgMTR2NyIvPjwvc3ZnPg=="></picture>

# MaxSpeak — AI Text to Speech Studio

> **Free · Open Source · 300+ Voices · Voice Cloning · Voice Design**
>
> Powered by [MiniMax](https://platform.minimax.io) — the leading speech synthesis API.

[🌐 Live Demo](https://maxspeak.vercel.app) · [🚀 Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/harlan-zhang/maxspeak)

---

*中文文档：[README.md](./README.md)*

## Why MaxSpeak

| Feature | Description |
|---------|-------------|
| **Text to Speech** | Convert any text to natural speech with 9 emotion styles, paralinguistic tags (sighs/laughs/breaths), and fine-grained speed/pitch/timbre controls |
| **AI Voice Planner** | Suggest pauses, vocal cues, and pronunciations for a selection or the full script, with per-suggestion A/B previews and undo |
| **Voice Cloning** | Upload a 10-second audio sample and replicate any voice — ideal for creators, podcasts, audiobooks, and accessibility |
| **Voice Design** | Describe a voice in plain English and let AI create it — "a warm, friendly female voice for a bedtime story" |
| **Streaming & Sync** | Get instant playback via SSE streaming for long texts, or download high-quality audio files |
| **300+ System Voices** | Pre-built voices in Chinese, English, Japanese, Korean, Spanish, Portuguese, French, and 14 more languages |

## Quick Start

```bash
git clone https://github.com/harlan-zhang/maxspeak.git
cd maxspeak
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click the settings gear, paste your [MiniMax API key](https://platform.minimax.io), and start generating speech.

## AI Voice Planner

1. In **Settings → AI 配音编排**, choose the provider that issued your key. The presets include MiniMax China, MiniMax International, OpenAI, DeepSeek, and OpenRouter. Enter a text model ID and key. Choose the custom provider to use an OpenAI Chat Completions-compatible base URL (for example, `http://localhost:11434/v1`) and model ID. Use the connection test to send a fixed test message.
2. Enter your script in Text to Speech. Choose Natural, Short-Video Voiceover, Storytelling, or Promotional Narration and analyze the current selection or the entire script. Enable filler suggestions for spoken interjections. Enable copy edits and price readings for spoken phrasing and local price readings such as `9.9` as `九块九`. Promotional Narration can suggest edits to the opening, title, and closing.
3. Review each suggestion and preview the original and suggested versions of the same passage. When you analyze a selection, previews stay within that selection. Check the changes you want and apply them. Copy edits and price readings replace the selected passage. Pinyin, IPA, and aliases go into the pronunciation dictionary, for example `xing2 hong2` for `行洪`. Editing the script, dictionary, or speech model requires a fresh analysis. You can undo the latest application.

The text model and speech synthesis use separate keys. The text key lives in the current page's memory. Switching providers, editing the base URL, or refreshing clears it. Presets go through the app's fixed provider relay. Custom URLs connect directly from the browser. Public URLs require HTTPS. Local HTTP connections are subject to browser permissions and the gateway's CORS settings, and can use a blank key. Each A/B preview makes one synchronous MiniMax synthesis request per version using the selected voice and settings.

Copy edits are off by default and leave passages containing Arabic numerals alone. Price readings cover RMB amounts from 1 to 99.99 with one or two decimal digits, marked with `元` or immediately following a price cue such as `只需` or `现价`. Speech 2.8 HD and Turbo support vocal cues. The pronunciation dictionary applies to the entire script, so the planner accepts only unique terms compatible with existing manual rules. See the [MiniMax speech synthesis documentation](https://platform.minimax.io/docs/api-reference/speech-t2a-http.md) for supported formats.

## Deploy

### Vercel (Recommended)
Click to deploy with zero configuration:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/harlan-zhang/maxspeak)

### Cloudflare Pages
```bash
npm install -D @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

> **Note:** Cloudflare Pages deploys as static output. API Routes won't work — use Vercel for full functionality.

## Tech Stack

- **Framework** — Next.js 14 (App Router) + TypeScript
- **UI** — React 18 + Tailwind CSS + lucide-react icons
- **State** — Zustand (persisted to localStorage)
- **Audio** — Web Audio API + native `<audio>` for robust cross-browser playback
- **API** — Next.js API Routes proxying MiniMax TTS, Voice Clone, and Voice Design endpoints

## Architecture — MiniMax API Proxy

```
Browser                Next.js Server                   MiniMax API
  │                         │                               │
  ├─ POST /api/tts/synthesize ──►  POST /v1/t2a_v2 ──►        │
  │                         │    (output_format=hex)          │
  │                         │                               │
  │                         │   ◄── hex audio data ─────────┤
  │                         │                               │
  │                         │   Server format detection:     │
  │                         │   ID3/MP3 · RIFF/WAV           │
  │                         │   fLaC/FLAC · OggS/OGG         │
  │                         │   unmatched? → PCM → WAV wrap  │
  │                         │                               │
  │  ◄── binary audio blob ─┤                               │
  │  (Content-Type: audio/*)│                               │
  │                         │                               │
  ▼                   API key is stored locally and sent to the app proxy ▼
 [blob URL → <audio>]                                   [300+ voices]
```

- **Local API key mode** — users paste their MiniMax API key in the browser settings panel; it is stored in local `localStorage` and forwarded through this app's Next.js API Routes, so only use trusted deployments
- **Server-side format detection** — auto-detects 5 container formats (ID3/MP3, RIFF/WAV, fLaC/FLAC, OggS/OGG, FFxx/MPEG); bare PCM auto-wrapped in WAV
- **Binary response** — server always returns `Content-Type: audio/*`, client uses `res.blob()` single path
- Streaming uses SSE passthrough with real-time chunk decoding

## Supported Languages & Voices

| Language | Count | Highlights |
|----------|-------|------------|
| 中文 (Chinese) | 34 | 可靠高管, 新闻主播, 暖心闺蜜, 可爱精灵 |
| English | 45 | Expressive Narrator, Radiant Girl, Magnetic Voiced Man |
| 한국어 (Korean) | 49 | 운동소녀, 차분한 신사, 용감한 모험가 |
| 日本語 (Japanese) | 15 | 知的先輩, 優しい執事, 優雅な乙女 |
| 粵語 (Cantonese) | 6 | 專業主持, 溫柔女士, 可愛女孩 |
| Español | 12+ | Presentador Profesional, Narrador, Chica Alegre |
| Português | 10+ | Apresentador Profissional, Narrador, Jovem Brasileiro |
| Others | 3–8 each | Français, Deutsch, Русский, Italiano, Nederlands, Tiếng Việt, العربية, Türkçe, Українська, ภาษาไทย, Polski, हिन्दी |

Full list in `lib/voices/preset-voices.ts`.

In Voice Library, sync from the API to save the current MiniMax account’s cloned and designed voices in this browser. Choose **Custom voices** in the synthesis language filter to use them. The browser stores a separate catalog for each API key and server. Changing either clears the selected custom voice.

After upgrading, sync once with your original MiniMax configuration. The browser retains legacy records. Select the option to restore legacy previews and prompts before syncing to recover that information for voices with a matching category and ID. MiniMax returns a custom voice after it has been used successfully for synthesis.

## Audio Features

- **Emotion Control** — happy, sad, angry, fearful, disgusted, surprised, neutral, fluent, whisper
- **Paralinguistic Tags** — `(sighs)` `(laughs)` `(breath)` `(gasps)` and 18 more *(speech-2.8 models only)*
- **Voice Modifier** — pitch, intensity, timbre, and sound effects (spacious echo, telephone, radio, megaphone)
- **Audio Format** — MP3 / WAV / FLAC / PCM · 8–44.1 kHz · 64–320 kbps · mono/stereo
- **Pronunciation Dictionary** — custom phoneme overrides for Chinese tones and English words

## Pricing

MaxSpeak is free and open source. MiniMax API charges apply per use:

| Item | Cost |
|------|------|
| Text-to-Speech | ¥2.0–3.5 / 10K chars |
| Voice Clone | ¥9.9 per voice (first-use) |
| Voice Design Preview | $30 / 1M chars |

See [MiniMax Pricing](https://platform.minimax.io/docs/guides/pricing-speech) for details.

## Project Structure

```
maxspeak/
├── app/
│   ├── layout.tsx      # Layout + SEO metadata
│   ├── page.tsx        # Main page with tab routing
│   └── api/            # 8 API route handlers
├── components/
│   ├── layout/         # Sidebar, Header, ThemeProvider
│   ├── tts/            # Text-to-Speech panel & controls
│   ├── player/         # Audio player with progress bar
│   ├── clone/          # Voice cloning wizard (upload → configure → preview)
│   ├── design/         # Voice design from text prompts
│   ├── library/        # Voice library browser
│   └── settings/       # Settings modal
├── public/             # Logo, poster, and static assets
└── lib/
    ├── minimax/        # API client, types, constants
    ├── planner/        # AI planning, suggestion validation, and application
    ├── audio/          # Playback engine, stream decoder, utilities
    ├── voices/         # 300+ preset voices, emotion tags, language data
    └── store/          # Zustand state stores
```

## Changes and Verification

### 1.2.0

- Add Promotional Narration, optional copy edits and RMB price readings, more fillers, and pronunciation prompts for technical terms. Suggestions support A/B previews, individual selection, and undo.
- Regression tests cover repeated prices, existing pause markers, technical-term pronunciation, and protections for numeric values and existing pronunciation entries.

### 1.1.1

- Add MiniMax China to AI voice planning. Each MiniMax region uses its official text endpoint with shared model options. `npm test` covers the request URLs and options for both presets.

### 1.1.0

- Add AI voice planning for selections and full scripts with three styles, pause and pronunciation suggestions, optional fillers, A/B previews, and undo.
- Use separate text model settings for four preset providers, custom public gateways, and local compatible models.
- Move mobile navigation into a drawer to give the editor and previews the full workspace width.
- Run `npm test` for voice sync, suggestion validation, atomic apply and undo, fixed provider routing, and custom direct connections. Use `npm run lint` and `npm run build` for lint and the production build.

### 1.0.1

- Make synced cloned and designed voices available in the synthesis selector.
- Share one account- and server-scoped catalog across cloning, design, and sync, with coordinated writes across tabs.
- Normalize grouped and flat MiniMax voice lists and surface MiniMax errors during sync.

## License

MIT — build anything. [MiniMax API terms](https://platform.minimax.io) apply for API usage.
