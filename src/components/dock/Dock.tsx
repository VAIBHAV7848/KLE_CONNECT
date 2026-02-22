import { useCallback, useState } from 'react';
import { useDockAnimation } from '@/hooks/useDockAnimation';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import DockItem from './DockItem';
import { AnimatePresence, motion } from 'framer-motion';
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
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

const MOBILE_PRIMARY_ROUTES = ['/', '/ai-tutor', '/thinklm', '/notes'];

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/', gradient: 'linear-gradient(135deg, hsl(199 89% 48% / 0.3), hsl(199 89% 48% / 0.1))' },
  { icon: Bot, label: 'AI Tutor', to: '/ai-tutor', gradient: 'linear-gradient(135deg, hsl(263 70% 58% / 0.3), hsl(263 70% 58% / 0.1))' },
  { icon: Sparkles, label: 'ThinkLM', to: '/thinklm', gradient: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(199 89% 48% / 0.1))' },
  { icon: BookOpen, label: 'Notes', to: '/notes', gradient: 'linear-gradient(135deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.1))' },
  { icon: Brain, label: 'Planner', to: '/planner', gradient: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(45 93% 47% / 0.1))' },
  { icon: GraduationCap, label: 'Rooms', to: '/study-rooms', gradient: 'linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))' },
  { icon: Map, label: 'Campus', to: '/campus-map', gradient: 'linear-gradient(135deg, hsl(15 90% 55% / 0.3), hsl(15 90% 55% / 0.1))' },
  { icon: Calendar, label: 'Events', to: '/events', gradient: 'linear-gradient(135deg, hsl(280 70% 50% / 0.3), hsl(280 70% 50% / 0.1))' },
  { icon: MessageCircle, label: 'Doubts', to: '/doubts', gradient: 'linear-gradient(135deg, hsl(180 70% 45% / 0.3), hsl(180 70% 45% / 0.1))' },
  { icon: MessageSquare, label: 'Community', to: '/community', gradient: 'linear-gradient(135deg, hsl(320 70% 50% / 0.3), hsl(320 70% 50% / 0.1))' },
  { icon: Users, label: 'Seniors', to: '/senior-connect', gradient: 'linear-gradient(135deg, hsl(220 70% 55% / 0.3), hsl(220 70% 55% / 0.1))' },
  { icon: Heart, label: 'Help', to: '/student-help', gradient: 'linear-gradient(135deg, hsl(350 80% 50% / 0.3), hsl(350 80% 50% / 0.1))' },
  { icon: HeartHandshake, label: 'Support', to: '/support', gradient: 'linear-gradient(135deg, hsl(35 90% 55% / 0.3), hsl(35 90% 55% / 0.1))' },
  { icon: ShieldCheck, label: 'Admin', to: '/admin', gradient: 'linear-gradient(135deg, hsl(0 100% 50% / 0.3), hsl(217 91% 60% / 0.1))' },
  { icon: Settings, label: 'Settings', to: '/settings', gradient: 'linear-gradient(135deg, hsl(217 20% 50% / 0.3), hsl(217 20% 50% / 0.1))' },
];

const Dock = () => {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredItems = navigationItems.filter((item) => {
    if (item.to === '/admin') return isAdmin;
    return true;
  });

  const mobilePrimaryItems = filteredItems.filter((item) => MOBILE_PRIMARY_ROUTES.includes(item.to));
  const mobileSecondaryItems = filteredItems.filter((item) => !MOBILE_PRIMARY_ROUTES.includes(item.to));
  const itemsToRender = isMobile ? mobilePrimaryItems : filteredItems;

  const { dockRef, setItemRef } = useDockAnimation(itemsToRender.length, {
    baseSize: 48,
    maxScale: isMobile ? 1 : 1.6,
    maxDistance: isMobile ? 0 : 100,
  });

  const createRefCallback = useCallback(
    (index: number) => {
      return (el: HTMLDivElement | null) => setItemRef(index, el);
    },
    [setItemRef]
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-[90px] left-4 right-4 z-[90] glass rounded-[24px] p-4 max-h-[60vh] overflow-y-auto no-scrollbar shadow-2xl border border-primary/20"
            >
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {mobileSecondaryItems.map((item) => (
                  <DockItem
                    key={item.to}
                    icon={item.icon}
                    label={item.label}
                    to={item.to}
                    gradient={item.gradient}
                    onSetRef={() => { }}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div
        className={`fixed z-[100] transition-all duration-300 ${isMobile
          ? 'bottom-0 left-0 right-0 w-full'
          : 'bottom-4 left-1/2 -translate-x-1/2'
          }`}
      >
        <div
          ref={dockRef}
          className={`glass-dock flex items-end ${isMobile
            ? 'rounded-t-3xl px-4 pt-3 pb-safe justify-between border-l-0 border-r-0 border-b-0 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] bg-background/90'
            : 'rounded-2xl px-3 py-2.5 gap-1 justify-center shadow-lg'
            }`}
        >
          {itemsToRender.map((item, index) => (
            <DockItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              gradient={item.gradient}
              onSetRef={createRefCallback(index)}
            />
          ))}

          {isMobile && (
            <button
              onClick={() => {
                if (typeof navigator.vibrate === 'function') navigator.vibrate(20);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="relative flex flex-col items-center justify-center transition-colors duration-200 w-[64px] h-[64px] rounded-2xl active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className={`absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 bg-primary/10 border border-primary/20 shadow-[0_4px_16px_rgba(0,195,255,0.1)]' : ''
                  }`}
              />
              {mobileMenuOpen ? (
                <X className="w-6 h-6 mb-1 text-primary drop-shadow-[0_0_8px_rgba(0,195,255,0.4)] relative z-10 scale-110" />
              ) : (
                <Menu className="w-6 h-6 mb-1 text-muted-foreground relative z-10" />
              )}
              <span
                className={`text-[11px] font-medium leading-tight truncate w-full text-center px-1 relative z-10 transition-colors ${mobileMenuOpen ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
              >
                More
              </span>
            </button>
          )}
        </div>

        {!isMobile && (
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 opacity-20 blur-xl pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, hsl(199 89% 48% / 0.3), transparent)',
            }}
          />
        )}
      </div>
    </>
  );
};

export default Dock;
