import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DockItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  gradient?: string;
  onSetRef: (el: HTMLDivElement | null) => void;
}

/**
 * Individual dock item with tooltip and active state
 */
const DockItem = ({ icon: Icon, label, to, gradient, onSetRef }: DockItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to;
  const isMobile = useIsMobile();

  const handleRef = useCallback((el: HTMLDivElement | null) => {
    onSetRef(el);
  }, [onSetRef]);

  return (
    <div
      ref={handleRef}
      className="dock-item relative origin-bottom"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ willChange: 'transform' }}
    >
      {/* Tooltip (Only showing on desktop where hover makes sense) */}
      <AnimatePresence>
        {!isMobile && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="glass px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Button Area */}
      <Link
        to={to}
        onClick={() => {
          // Pro detail: Subtle haptic vibration when tapping tabs on mobile devices
          if (isMobile && typeof navigator.vibrate === 'function') {
            navigator.vibrate(30);
          }
        }}
        className={`
          relative flex flex-col items-center justify-center 
          transition-colors duration-200 group
          ${isMobile ? 'w-16 py-1.5 h-[60px] rounded-[20px]' : 'rounded-xl w-12 h-12'}
          ${isActive && !isMobile ? 'active' : ''}
        `}
        aria-label={label}
      >
        {/* Pro Mobile feature: Fluid sliding active indicator (imitates native tabs) */}
        {isMobile && isActive && (
          <motion.div
            layoutId="mobileActiveDockBubble"
            className="absolute inset-0 bg-primary/15 border-[0.5px] border-primary/30 backdrop-blur-md z-0"
            style={{ borderRadius: '20px' }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
        )}

        {/* Desktop glow layer */}
        {!isMobile && (
          <div
            className={`
              absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 z-0
              ${isActive ? 'opacity-100' : 'group-hover:opacity-70'}
            `}
            style={{
              background: gradient || 'linear-gradient(135deg, hsl(199 89% 48% / 0.25), hsl(263 70% 58% / 0.25))'
            }}
          />
        )}

        {/* Icon */}
        <Icon
          className={`
            relative z-10 transition-colors duration-200
            ${isMobile ? 'w-[22px] h-[22px] mb-1' : 'w-6 h-6'}
            ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(0,195,255,0.4)]' : 'text-muted-foreground group-hover:text-foreground'}
          `}
        />

        {/* Mobile text label under icon */}
        {isMobile && (
          <span
            className={`text-[10px] leading-tight relative z-10 truncate w-full text-center px-1 transition-all duration-300
            ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}
          `}>
            {label}
          </span>
        )}

        {/* Active indicator dot (Desktop Only, since mobile uses text highlighting + bg) */}
        {!isMobile && isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    </div>
  );
};

export default DockItem;
