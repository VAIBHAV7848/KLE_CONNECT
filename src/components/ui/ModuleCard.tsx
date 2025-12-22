import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
  children?: ReactNode;
}

/**
 * Reusable card component for module content
 */
const ModuleCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient, 
  delay = 0,
  children 
}: ModuleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="module-card group"
    >
      {/* Icon with gradient background */}
      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: gradient }}
      >
        <Icon className="w-7 h-7 text-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        {description}
      </p>
      
      {children}
    </motion.div>
  );
};

export default ModuleCard;
