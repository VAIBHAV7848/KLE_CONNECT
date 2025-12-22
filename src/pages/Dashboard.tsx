import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import ModuleCard from '@/components/ui/ModuleCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Brain,
  GraduationCap,
  TrendingUp,
  Clock,
  Target,
  LogIn,
  User
} from 'lucide-react';

/**
 * Dashboard - Main landing page for KLE CONNECT
 */
const Dashboard = () => {
  const { user, loading, signOut } = useAuth();

  const stats = [
    { label: 'Study Hours', value: '24.5', icon: Clock, change: '+12%' },
    { label: 'Tasks Done', value: '47', icon: Target, change: '+8%' },
    { label: 'Streak Days', value: '12', icon: TrendingUp, change: '+3' },
  ];

  const quickActions = [
    {
      icon: Bot,
      title: 'AI Tutor',
      description: 'Get instant help with your assignments and concepts',
      gradient: 'linear-gradient(135deg, hsl(263 70% 58% / 0.3), hsl(263 70% 58% / 0.1))'
    },
    {
      icon: BookOpen,
      title: 'Notes & PYQs',
      description: 'Access curated study materials and past papers',
      gradient: 'linear-gradient(135deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.1))'
    },
    {
      icon: Brain,
      title: 'Study Planner',
      description: 'Plan your study sessions and track progress',
      gradient: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(45 93% 47% / 0.1))'
    },
    {
      icon: GraduationCap,
      title: 'Study Rooms',
      description: 'Join virtual study sessions with classmates',
      gradient: 'linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))'
    },
  ];

  return (
    <PageLayout>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(199 89% 48% / 0.3), hsl(263 70% 58% / 0.3))' }}
            >
              <LayoutDashboard className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-display">
                <span className="text-gradient">KLE</span>
                <span className="text-foreground"> CONNECT</span>
              </h1>
              <p className="text-muted-foreground">
                {user ? `Welcome back, ${user.user_metadata?.full_name || user.email}!` : 'Your college companion, powered by AI'}
              </p>
            </div>
          </div>

          {/* Auth Button */}
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground hidden md:inline">
                    {user.email}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        {stats.map((stat, index) => (
          <div key={stat.label} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(199 89% 48% / 0.2), hsl(199 89% 48% / 0.05))' }}
            >
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-display">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <span className="ml-auto text-xs text-primary font-medium">{stat.change}</span>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-4"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Quick Actions</h2>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <ModuleCard
            key={action.title}
            icon={action.icon}
            title={action.title}
            description={action.description}
            gradient={action.gradient}
            delay={0.3 + index * 0.1}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8"
      >
        <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Recent Activity</h2>
        <div className="glass rounded-2xl p-6">
          <div className="space-y-4">
            {[
              { action: 'Completed', item: 'Data Structures Quiz', time: '2 hours ago' },
              { action: 'Joined', item: 'Study Room: Algorithm Design', time: '5 hours ago' },
              { action: 'Downloaded', item: 'Operating Systems Notes', time: 'Yesterday' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-primary text-sm font-medium">{activity.action}</span>
                  <span className="text-foreground text-sm ml-2">{activity.item}</span>
                </div>
                <span className="text-muted-foreground text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Dashboard;
