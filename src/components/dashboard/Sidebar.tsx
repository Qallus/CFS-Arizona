'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Dna,
  Brain,
  Wrench,
  Clock,
  Target,
  CheckSquare,
  ListTodo,
  Settings,
  Phone,
  Sun,
  Moon,
  Calendar,
  Users,
  Zap,
  UserPlus,
  FolderKanban,
  DollarSign,
  BarChart3,
  FileText,
  Megaphone,
  Bot,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Package,
  X,
  Rocket,
  StickyNote,
  User,
  Globe,
  Shield,
  UserCog,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { Sig360LogoMark } from '@/components/branding/Sig360LogoMark';

// AI nested items
const aiNavigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'DNA', href: '/dna', icon: Dna },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Skills', href: '/skills', icon: Wrench },
  { name: 'Cron', href: '/cron', icon: Clock },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'To-Do', href: '/todos', icon: CheckSquare },
  { name: 'Missions', href: '/missions', icon: ListTodo },
];

// Account nested items
const accountNavigation = [
  { name: 'Profile', href: '/account/profile', icon: User },
  { name: 'Public Profile', href: '/account/public-profile', icon: Globe },
  { name: 'User Settings', href: '/account/user-settings', icon: UserCog },
  { name: 'Security', href: '/account/security', icon: Shield },
  { name: 'Roles & Permissions', href: '/account/roles', icon: Users },
  { name: 'Payment Setup', href: '/account/payment-setup', icon: CreditCard },
];

// Main navigation (flat items)
const mainNavigation = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Communications', href: '/communications', icon: Phone },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Pipeline', href: '/pipeline', icon: DollarSign },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Posts', href: '/posts', icon: FileText },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Billing', href: '/billing', icon: FileText },
  { name: 'Advertising', href: '/advertising', icon: Megaphone },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Deploy', href: '/deploy', icon: Rocket },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  status?: 'working' | 'thinking' | 'sleeping';
  onClose?: () => void;
}

export function Sidebar({ status = 'sleeping', onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  // Check if any AI route is active
  const isAiRouteActive = aiNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  
  // Check if any Account route is active
  const isAccountRouteActive = accountNavigation.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  
  // Default to expanded if a route is active
  const [aiExpanded, setAiExpanded] = useState(isAiRouteActive);
  const [accountExpanded, setAccountExpanded] = useState(isAccountRouteActive);

  const statusColors = {
    working: 'bg-green-500',
    thinking: 'bg-yellow-500',
    sleeping: 'bg-gray-500',
  };

  const statusLabels = {
    working: 'Working',
    thinking: 'Thinking',
    sleeping: 'Idle',
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <Sig360LogoMark />
          <div>
            <h1 className="text-lg font-bold text-foreground">SIG360</h1>
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', statusColors[status])} />
              <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
            </div>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* AI Section */}
        <div>
          <button
            onClick={() => setAiExpanded(!aiExpanded)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isAiRouteActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5" />
              <span>AI</span>
            </div>
            {aiExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {aiExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l border-border space-y-1">
              {aiNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Navigation */}
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Account Section */}
        <div>
          <button
            onClick={() => setAccountExpanded(!accountExpanded)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isAccountRouteActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" />
              <span>Account</span>
            </div>
            {accountExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {accountExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l border-border space-y-1">
              {accountNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border space-y-3">
        {/* User info */}
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-brand-foreground">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Theme toggle and version */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">SIG360 v1.0</p>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
