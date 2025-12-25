import { useCallback } from 'react';
import { useDockAnimation } from '@/hooks/useDockAnimation';
import DockItem from './DockItem';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Brain,
  GraduationCap,
  Map,
  Calendar,
  MessageCircle,
  Users,
  Heart,
  HeartHandshake,
  Settings
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
  const { dockRef, setItemRef } = useDockAnimation(navigationItems.length, {
    baseSize: 48,
    maxScale: 1.6,
    maxDistance: 100
  });

  const createRefCallback = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => setItemRef(index, el);
  }, [setItemRef]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      {/* Dock container with glassmorphism */}
      <div
        ref={dockRef}
        className="glass-dock rounded-2xl px-3 py-2.5 flex items-end gap-1"
      >
        {navigationItems.map((item, index) => (
          <DockItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            gradient={item.gradient}
            onSetRef={createRefCallback(index)}
          />
        ))}
      </div>
      
      {/* Subtle reflection effect */}
      <div 
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 opacity-20 blur-xl pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, hsl(199 89% 48% / 0.3), transparent)'
        }}
      />
    </div>
  );
};

export default Dock;
