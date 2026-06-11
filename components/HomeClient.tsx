'use client';

import { TextToSpeechPanel } from '@/components/tts/TextToSpeechPanel';
import { VoiceClonePanel } from '@/components/clone/VoiceClonePanel';
import { VoiceDesignPanel } from '@/components/design/VoiceDesignPanel';
import { VoiceLibrary } from '@/components/library/VoiceLibrary';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useNavStore } from '@/lib/store/useNavStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Settings, ArrowRight } from 'lucide-react';

export function HomeClient() {
  const activeTab = useNavStore((s) => s.activeTab);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const isCN = baseUrl.includes('minimaxi.com');
  const platformUrl = isCN ? 'https://platform.minimaxi.com' : 'https://platform.minimax.io';
  const platformHost = isCN ? 'platform.minimaxi.com' : 'platform.minimax.io';

  return (
    <div className="flex flex-col h-full">
      {/* ─── API Key warning banner ─── */}
      {!apiKey && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5
                        bg-amber-50 dark:bg-amber-500/8
                        border-b border-amber-200 dark:border-amber-500/20">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>未设置 API Key，无法合成语音。</span>
            <span className="hidden sm:inline text-amber-600 dark:text-amber-400 text-xs">
              前往 <a href={platformUrl} target="_blank"
                       rel="noopener noreferrer"
                       className="underline hover:no-underline font-medium">
                {platformHost}
              </a> 获取 MiniMax API Key
            </span>
          </div>
          <button
            onClick={() => (document.querySelector('[title="设置"]') as HTMLButtonElement)?.click()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                       bg-amber-200 dark:bg-amber-500/20
                       text-amber-800 dark:text-amber-300
                       hover:bg-amber-300 dark:hover:bg-amber-500/30
                       transition-colors flex-shrink-0"
          >
            <Settings size={13} />
            打开设置
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ─── Tab content ─── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'tts' && <TextToSpeechPanel />}
            {activeTab === 'clone' && <VoiceClonePanel />}
            {activeTab === 'design' && <VoiceDesignPanel />}
            {activeTab === 'library' && <VoiceLibrary />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
