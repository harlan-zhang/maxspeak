import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'MaxSpeak — AI Text to Speech & Voice Cloning Studio',
    template: '%s | MaxSpeak',
  },
  description:
    'Free online AI text to speech studio. 300+ realistic voices in 20+ languages powered by MiniMax API. Clone any voice from audio, design custom voices, or generate natural speech with emotion control.',
  icons: {
    icon: '/logo.webp',
  },
  keywords: [
    'text to speech', 'TTS', 'AI voice generator', 'voice cloning',
    'speech synthesis', 'text to audio', 'AI语音合成', '语音克隆',
    'voice design', 'MiniMax TTS', 'free text to speech', 'online TTS',
    'realistic AI voices', 'speech generator',
  ],
  authors: [{ name: 'MaxSpeak' }],
  openGraph: {
    title: 'MaxSpeak — AI Text to Speech & Voice Cloning Studio',
    description:
      '300+ voices across 20+ languages. Clone, design, or pick a voice. Natural speech with emotion & style control. Powered by MiniMax API.',
    type: 'website',
    siteName: 'MaxSpeak',
    images: ['/poster.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-[rgb(var(--background))] antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
