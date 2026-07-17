'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AssistantFab } from './AssistantFab';
import { AIStatusProvider, useAIStatus } from '@/components/providers/AIStatusProvider';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { status } = useAIStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the desktop collapse preference.
  useEffect(() => {
    setCollapsed(localStorage.getItem('cfs_sidebar_collapsed') === '1');
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem('cfs_sidebar_collapsed', next ? '1' : '0');
      return next;
    });

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - always visible on desktop, toggleable on mobile */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar status={status} collapsed={collapsed} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content with top bar (collapse, back, search, bell, theme) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenu={() => setSidebarOpen(true)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <AssistantFab />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AIStatusProvider>
      <DashboardContent>{children}</DashboardContent>
    </AIStatusProvider>
  );
}
