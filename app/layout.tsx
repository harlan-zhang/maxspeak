import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'MaxSpeak — MiniMax AI 语音合成 | 在线 TTS 文字转语音工作台',
    template: '%s | MaxSpeak — MiniMax TTS',
  },
  description:
    'MaxSpeak 是基于 MiniMax API 的免费在线 AI 语音合成工具。支持 300+ 逼真音色、音色复刻、音色设计、9 种情感风格、流式合成，覆盖 20+ 种语言。无需安装，打开浏览器即可使用 MiniMax TTS。',
  icons: {
    icon: '/logo.webp',
  },
  keywords: [
    // 中文
    'MiniMax TTS', 'MiniMax 文字转语音', 'AI 语音合成', '在线 TTS',
    '文字转语音', '语音克隆', '音色复刻', '语音设计',
    'AI 配音', '有声书配音', 'MiniMax API',
    '免费 TTS', '在线文字转语音', '语音生成器',
    // English
    'MiniMax text to speech', 'AI voice generator', 'voice cloning',
    'speech synthesis', 'text to audio', 'free online TTS',
    'realistic AI voices', 'speech generator', 'AI voiceover',
    'MiniMax voice design', 'MiniMax speech API',
  ],
  authors: [{ name: 'MaxSpeak', url: 'https://github.com/harlan-zhang/maxspeak' }],
  creator: 'MaxSpeak',
  publisher: 'MaxSpeak',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'MaxSpeak — MiniMax AI 语音合成 | 在线 TTS 文字转语音工作台',
    description:
      '基于 MiniMax API 的免费在线 AI 语音合成工具。300+ 逼真音色、音色克隆、语音设计、情感控制。支持 20+ 语言，打开浏览器即用。',
    type: 'website',
    siteName: 'MaxSpeak — MiniMax TTS',
    locale: 'zh_CN',
    images: ['/poster.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MaxSpeak — MiniMax AI 语音合成 | 在线 TTS',
    description:
      '免费在线 AI 语音合成。MiniMax API 驱动，300+ 音色，音色复刻，语音设计。',
    images: ['/poster.webp'],
  },
  alternates: {
    canonical: 'https://maxspeak.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'MaxSpeak — MiniMax AI 语音合成工作台',
              url: 'https://maxspeak.vercel.app',
              description:
                '基于 MiniMax API 的免费在线 AI 语音合成工具。支持 300+ 逼真音色、音色复刻、音色设计、9 种情感风格控制。',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
              author: {
                '@type': 'Organization',
                name: 'MaxSpeak',
                url: 'https://github.com/harlan-zhang/maxspeak',
              },
              featureList: [
                'MiniMax TTS 文字转语音',
                'AI 语音克隆 / Voice Cloning',
                'AI 语音设计 / Voice Design',
                '300+ MiniMax 系统音色',
                '9 种情感风格控制',
                '22 种副语言标签',
                'SSE 流式合成',
                '20+ 语言支持',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[rgb(var(--background))] antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
