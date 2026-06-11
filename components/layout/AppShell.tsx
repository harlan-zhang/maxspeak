'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AudioPlayer } from '@/components/player/AudioPlayer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto scrollbar-thin bg-[rgb(var(--muted))]/30">
          <div className="animate-fade-in pb-16">
            {children}
          </div>
        </main>
      </div>

      {/* Fixed Bottom Player — outside scroll area, always visible */}
      <AudioPlayer />
    </div>
  );
}
