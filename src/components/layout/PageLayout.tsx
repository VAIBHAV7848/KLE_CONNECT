import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Dock from '@/components/dock/Dock';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Main layout wrapper with dock navigation
 * All pages render inside this layout
 */
const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(199 89% 48% / 0.15) 0%, transparent 50%)'
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(263 70% 58% / 0.15) 0%, transparent 50%)'
          }}
        />
      </div>

      {/* Main content area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="page-container relative z-10"
      >
        {children}
      </motion.main>

      {/* Dock navigation */}
      <Dock />
    </div>
  );
};

export default PageLayout;
