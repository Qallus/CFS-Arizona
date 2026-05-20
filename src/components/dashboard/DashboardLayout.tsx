'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AIStatusProvider, useAIStatus } from '@/components/providers/AIStatusProvider';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { status } = useAIStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>
      
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
        <Sidebar status={status} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content - add left padding on mobile for hamburger */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        {children}
      </main>
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
