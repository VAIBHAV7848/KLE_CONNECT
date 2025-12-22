import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
}

/**
 * Reusable page header component with icon and gradient
 */
const PageHeader = ({ icon: Icon, title, subtitle, gradient }: PageHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: gradient }}
        >
          <Icon className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PageHeader;
