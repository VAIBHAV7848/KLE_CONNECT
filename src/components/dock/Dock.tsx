import { useCallback } from 'react';
import { useDockAnimation } from '@/hooks/useDockAnimation';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import DockItem from './DockItem';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Brain,
  Sparkles,
  GraduationCap,
  Map,
  Calendar,
  MessageCircle,
  MessageSquare,
  Users,
  Heart,
  HeartHandshake,
  Settings,
  ShieldCheck
} from 'lucide-react';

/**
 * Navigation items for the dock
 */
const navigationItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    to: '/',
    gradient: 'linear-gradient(135deg, hsl(199 89% 48% / 0.3), hsl(199 89% 48% / 0.1))'
  },
  {
    icon: Bot,
    label: 'AI Tutor',
    to: '/ai-tutor',
    gradient: 'linear-gradient(135deg, hsl(263 70% 58% / 0.3), hsl(263 70% 58% / 0.1))'
  },
  {
    icon: Sparkles,
    label: 'ThinkLM',
    to: '/thinklm',
    gradient: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(199 89% 48% / 0.1))'
  },
  {
    icon: BookOpen,
    label: 'Notes & PYQs',
    to: '/notes',
    gradient: 'linear-gradient(135deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.1))'
  },
  {
    icon: Brain,
    label: 'Study Planner',
    to: '/planner',
    gradient: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(45 93% 47% / 0.1))'
  },
  {
    icon: GraduationCap,
    label: 'Study Rooms',
    to: '/study-rooms',
    gradient: 'linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))'
  },
  {
    icon: Map,
    label: 'Campus Map',
    to: '/campus-map',
    gradient: 'linear-gradient(135deg, hsl(15 90% 55% / 0.3), hsl(15 90% 55% / 0.1))'
  },
  {
    icon: Calendar,
    label: 'Events',
    to: '/events',
    gradient: 'linear-gradient(135deg, hsl(280 70% 50% / 0.3), hsl(280 70% 50% / 0.1))'
  },
  {
    icon: MessageCircle,
    label: 'Doubts',
    to: '/doubts',
    gradient: 'linear-gradient(135deg, hsl(180 70% 45% / 0.3), hsl(180 70% 45% / 0.1))'
  },
  {
    icon: MessageSquare, // Use MessageSquare if imported, or import it
    label: 'Community',
    to: '/community',
    gradient: 'linear-gradient(135deg, hsl(320 70% 50% / 0.3), hsl(320 70% 50% / 0.1))'
  },
  {
    icon: Users,
    label: 'Senior Connect',
    to: '/senior-connect',
    gradient: 'linear-gradient(135deg, hsl(220 70% 55% / 0.3), hsl(220 70% 55% / 0.1))'
  },
  {
    icon: Heart,
    label: 'Student Help',
    to: '/student-help',
    gradient: 'linear-gradient(135deg, hsl(350 80% 50% / 0.3), hsl(350 80% 50% / 0.1))'
  },
  {
    icon: HeartHandshake,
    label: 'Support',
    to: '/support',
    gradient: 'linear-gradient(135deg, hsl(35 90% 55% / 0.3), hsl(35 90% 55% / 0.1))'
  },
  {
    icon: ShieldCheck,
    label: 'Admin',
    to: '/admin',
    gradient: 'linear-gradient(135deg, hsl(0 100% 50% / 0.3), hsl(217 91% 60% / 0.1))'
  },
  {
    icon: Settings,
    label: 'Settings',
    to: '/settings',
    gradient: 'linear-gradient(135deg, hsl(217 20% 50% / 0.3), hsl(217 20% 50% / 0.1))'
  },
];

/**
 * Main Dock component - macOS-style animated navigation
 */
const Dock = () => {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  // Filter out admin item if current user is not an admin
  const filteredItems = navigationItems.filter(item => {
    if (item.to === '/admin') return isAdmin;
    return true;
  });

  const { dockRef, setItemRef } = useDockAnimation(filteredItems.length, {
    baseSize: isMobile ? 40 : 48,
    maxScale: isMobile ? 1 : 1.6,
    maxDistance: isMobile ? 0 : 100
  });

  const createRefCallback = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => setItemRef(index, el);
  }, [setItemRef]);

  return (
    <div className={`fixed z-[100] transition-all duration-300 ${isMobile
        ? 'bottom-0 left-0 right-0 w-full'
        : 'bottom-4 left-1/2 -translate-x-1/2'
      }`}>
      {/* Dock container with glassmorphism */}
      <div
        ref={dockRef}
        className={`glass-dock flex items-end ${isMobile
            ? 'rounded-t-2xl px-2 py-3 gap-3 overflow-x-auto justify-start border-l-0 border-r-0 border-b-0 no-scrollbar pb-safe'
            : 'rounded-2xl px-3 py-2.5 gap-1 justify-center'
          }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {filteredItems.map((item, index) => (
          <div key={item.to} className={isMobile ? 'flex-shrink-0' : ''}>
            <DockItem
              icon={item.icon}
              label={item.label}
              to={item.to}
              gradient={item.gradient}
              onSetRef={createRefCallback(index)}
            />
          </div>
        ))}
      </div>

      {/* Subtle reflection effect */}
      {!isMobile && (
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 opacity-20 blur-xl pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, hsl(199 89% 48% / 0.3), transparent)'
          }}
        />
      )}
    </div>
  );
};

export default Dock;
