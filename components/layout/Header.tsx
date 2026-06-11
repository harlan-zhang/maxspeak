'use client';

import { useState } from 'react';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeftOpen, Settings, Circle, Github } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const apiKey = useSettingsStore((s) => s.apiKey);

  return (
    <>
      <header className="h-14 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            title={sidebarOpen ? '收起侧栏' : '展开侧栏'}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={18} className="text-[rgb(var(--muted-foreground))]" />
            ) : (
              <PanelLeftOpen size={18} className="text-[rgb(var(--muted-foreground))]" />
            )}
          </button>

          <h1 className="text-sm font-semibold text-[rgb(var(--foreground))] tracking-tight">
            MaxSpeak
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* API Key Status */}
          <a
            href="https://github.com/harlan-zhang/maxspeak"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                       bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400
                       hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700
                       transition-colors"
            title="GitHub"
          >
            <Github size={13} />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
            apiKey
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
          )}>
            <Circle size={5} className={cn(
              'fill-current',
              apiKey ? 'text-emerald-500' : 'text-amber-500'
            )} />
            {apiKey ? '已连接' : '未设置 Key'}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            title="设置"
          >
            <Settings size={18} className="text-[rgb(var(--muted-foreground))]" />
          </button>
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
