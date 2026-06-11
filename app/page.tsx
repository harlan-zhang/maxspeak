import { HomeClient } from '@/components/HomeClient';
import { Github } from 'lucide-react';

/**
 * SEO Landing Page — server-rendered for crawlers.
 *
 * This is the HTML that Google, Bing, Baidu etc. see when they index the site.
 * The actual interactive dashboard is rendered client-side via HomeClient.
 */

const GITHUB_URL = 'https://github.com/harlan-zhang/maxspeak';

export default function Page() {
  return (
    <div className="relative h-full">
      {/* ─── SEO content: readable by crawlers, hidden from interactive users ─── */}
      <div className="sr-only">
        <h1>MaxSpeak — MiniMax AI 语音合成工作台 | 在线 TTS 文字转语音</h1>
        <p>
          MaxSpeak 是基于 MiniMax API 的免费在线 AI 语音合成（TTS）工具。
          支持 300+ 种逼真 AI 音色，覆盖中文、英语、日语、韩语等 20+ 种语言。
          提供语音克隆（Voice Cloning）、语音设计（Voice Design）、情感风格控制、
          流式合成等专业功能。无需安装，打开浏览器即可使用。
        </p>
        <h2>核心功能</h2>
        <ul>
          <li>MiniMax TTS 文字转语音 — 支持 Speech 2.8 HD / Turbo 等最新模型</li>
          <li>AI 语音合成 — 9 种情感风格（开心、悲伤、愤怒、恐惧、中性、耳语等）</li>
          <li>音色复刻 / Voice Cloning — 上传 10 秒音频即可克隆任意音色</li>
          <li>音色设计 / Voice Design — 用自然语言描述即可生成专属 AI 音色</li>
          <li>300+ MiniMax 系统音色 — 中文普通话、粤语、英语、日语、韩语等多语言</li>
          <li>流式合成 — SSE 实时音频流，边生成边播放</li>
          <li>副语言标签 — 叹气、笑声、呼吸、咳嗽等 22 种自然副语言</li>
          <li>声音修饰 — 音高、强度、音色调节 + 电话/收音机/扩音器音效预设</li>
        </ul>
        <h2>适用场景</h2>
        <ul>
          <li>有声书配音 / AI Audiobook Narration</li>
          <li>视频配音 / AI Voiceover for Videos</li>
          <li>播客制作 / AI Podcast Voice</li>
          <li>游戏角色配音 / Game Character AI Voice</li>
          <li>无障碍语音 / Accessibility TTS</li>
          <li>广告配音 / Commercial Voiceover</li>
        </ul>
        <h2>技术栈</h2>
        <p>
          Next.js 14 + TypeScript + Tailwind CSS + MiniMax API。
          API Key 服务端代理，绝不泄露到浏览器。
          MIT 开源，免费使用。
        </p>
      </div>

      {/* ─── GitHub link — fixed bottom-left ─── */}
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2
                   rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm
                   border border-slate-200 dark:border-slate-700
                   shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
                   text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
                   transition-all duration-200 hover:shadow-xl hover:scale-105
                   text-xs font-medium"
        title="View source on GitHub"
      >
        <Github size={16} />
        <span className="hidden sm:inline">GitHub</span>
      </a>

      {/* ─── Interactive dashboard (client component) ─── */}
      <HomeClient />
    </div>
  );
}
