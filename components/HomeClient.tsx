'use client';

import { TextToSpeechPanel } from '@/components/tts/TextToSpeechPanel';
import { VoiceClonePanel } from '@/components/clone/VoiceClonePanel';
import { VoiceDesignPanel } from '@/components/design/VoiceDesignPanel';
import { VoiceLibrary } from '@/components/library/VoiceLibrary';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { useNavStore } from '@/lib/store/useNavStore';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HomeClient() {
  const activeTab = useNavStore((s) => s.activeTab);
  const apiKey = useSettingsStore((s) => s.apiKey);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10
                          flex items-center justify-center mx-auto mb-5">
            <Settings size={28} className="text-violet-500" />
          </div>
          <h2 className="text-xl font-bold text-[rgb(var(--foreground))] tracking-tight mb-2">
            Welcome to MaxSpeak
          </h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))] leading-relaxed mb-4">
            AI Text to Speech Studio powered by MiniMax API.
            <br />
            Clone voices, design new ones, or pick from 300+ preset voices.
          </p>
          <p className="text-xs text-[rgb(var(--muted-foreground))]/50 leading-relaxed">
            Get your API key at{' '}
            <a href="https://platform.minimax.io" target="_blank" rel="noopener noreferrer"
               className="text-violet-500 hover:underline font-medium">
              platform.minimax.io
            </a>
            {' '}and click the settings icon in the top-right corner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
