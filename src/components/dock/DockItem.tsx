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
  onClick?: () => void;
}

const DockItem = ({ icon: Icon, label, to, gradient, onSetRef, onClick }: DockItemProps) => {
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
      className={`relative origin-bottom ${isMobile ? 'flex flex-col items-center justify-center' : 'dock-item'}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{ willChange: 'transform, opacity' }}
    >
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

      <Link
        to={to}
        onClick={() => {
          if (isMobile && typeof navigator.vibrate === 'function') {
            navigator.vibrate(20);
          }
          if (onClick) onClick();
        }}
        className={`
          relative flex flex-col items-center justify-center 
          transition-colors duration-200 group
          ${isMobile ? 'w-[64px] h-[64px] rounded-2xl active:scale-95' : 'rounded-xl w-12 h-12'}
          ${isActive && !isMobile ? 'active' : ''}
        `}
        aria-label={label}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {isMobile && isActive && (
          <motion.div
            layoutId="mobileActiveDockBubble"
            className="absolute inset-0 bg-primary/10 border border-primary/20 shadow-[0_4px_16px_rgba(0,195,255,0.1)] z-0"
            style={{ borderRadius: '16px' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

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

        <Icon
          className={`
            relative z-10 transition-all duration-300
            ${isMobile ? 'w-6 h-6 mb-1' : 'w-6 h-6'}
            ${isActive
              ? isMobile
                ? 'text-primary drop-shadow-[0_0_8px_rgba(0,195,255,0.4)] scale-110'
                : 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground scale-100'
            }
          `}
        />

        {isMobile && (
          <span
            className={`text-[11px] leading-tight relative z-10 truncate w-full text-center px-1 transition-colors duration-300
            ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'}
          `}>
            {label}
          </span>
        )}

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
