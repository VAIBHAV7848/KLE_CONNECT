import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

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
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
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

      {/* Icon Button */}
      <Link
        to={to}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-xl
          transition-colors duration-200 group
          ${isActive ? 'active' : ''}
        `}
        aria-label={label}
      >
        {/* Background glow on hover/active */}
        <div
          className={`
            absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300
            ${isActive ? 'opacity-100' : 'group-hover:opacity-70'}
          `}
          style={{
            background: gradient || 'linear-gradient(135deg, hsl(199 89% 48% / 0.25), hsl(263 70% 58% / 0.25))'
          }}
        />

        {/* Icon */}
        <Icon
          className={`
            w-6 h-6 relative z-10 transition-colors duration-200
            ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
          `}
        />

        {/* Active indicator dot */}
        {isActive && (
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
