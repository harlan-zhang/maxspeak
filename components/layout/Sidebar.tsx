'use client';

import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';
import { useNavStore } from '@/lib/store/useNavStore';
import { Mic, Sparkles, Library, Volume2, Sun, Moon, Monitor } from 'lucide-react';

type Tab = 'tts' | 'clone' | 'design' | 'library';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const tabs: { id: Tab; label: string; icon: typeof Volume2 }[] = [
  { id: 'tts', label: '语音合成', icon: Volume2 },
  { id: 'clone', label: '音色复刻', icon: Mic },
  { id: 'design', label: '音色设计', icon: Sparkles },
  { id: 'library', label: '音色库', icon: Library },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const activeTab = useNavStore((s) => s.activeTab);
  const setActiveTab = useNavStore((s) => s.setActiveTab);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all duration-300',
        isOpen ? 'w-60' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[rgb(var(--border))]">
        <button onClick={onToggle} className="flex items-center gap-3 w-full text-left">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/logo.webp" alt="MaxSpeak" className="w-full h-full object-contain" />
          </div>
          {isOpen && (
            <div className="overflow-hidden min-w-0">
              <div className="font-semibold text-sm text-[rgb(var(--foreground))] leading-tight">
                MaxSpeak
              </div>
              <div className="text-[11px] text-[rgb(var(--muted-foreground))] font-medium">
                AI TTS Studio
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl text-sm transition-all duration-200',
                isOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                isActive
                  ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
              )}
              title={tab.label}
            >
              <Icon size={18} className={cn(
                'flex-shrink-0 transition-colors',
                isActive && 'text-violet-600 dark:text-violet-400'
              )} />
              {isOpen && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      {isOpen && (
        <div className="p-3 border-t border-[rgb(var(--border))]">
          <div className="flex gap-1 bg-[rgb(var(--muted))] rounded-xl p-0.5">
            <ThemeButton mode="light" icon={Sun} />
            <ThemeButton mode="dark" icon={Moon} />
            <ThemeButton mode="system" icon={Monitor} />
          </div>
        </div>
      )}
    </aside>
  );
}

function ThemeButton({ mode, icon: Icon }: { mode: 'light' | 'dark' | 'system'; icon: typeof Sun }) {
  const { theme, setTheme } = useTheme();
  const isActive = theme === mode;
  return (
    <button
      onClick={() => setTheme(mode)}
      className={cn(
        'flex-1 flex items-center justify-center py-1.5 rounded-[10px] transition-all duration-200',
        isActive
          ? 'bg-white dark:bg-slate-700 text-[rgb(var(--foreground))] shadow-sm'
          : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
      )}
      title={mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}
    >
      <Icon size={14} />
    </button>
  );
}
