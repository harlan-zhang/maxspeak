'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AudioPlayer } from '@/components/player/AudioPlayer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileSidebarOpen) setMobileSidebarOpen(false);
      }}
    >
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="关闭导航"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
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
