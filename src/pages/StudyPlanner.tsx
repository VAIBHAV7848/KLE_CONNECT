import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Brain, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Study Planner - Plan and track study sessions
 */
const StudyPlanner = () => {
  const todayTasks = [
    { title: 'Review Binary Search Trees', time: '9:00 AM', duration: '1h', completed: true },
    { title: 'Complete DSA Assignment', time: '11:00 AM', duration: '2h', completed: true },
    { title: 'Read OS Chapter 5', time: '2:00 PM', duration: '1.5h', completed: false },
    { title: 'Practice SQL Queries', time: '4:00 PM', duration: '1h', completed: false },
  ];

  const weeklyGoals = [
    { goal: 'Complete 20 LeetCode problems', progress: 65 },
    { goal: 'Finish Database project', progress: 40 },
    { goal: 'Read 3 research papers', progress: 33 },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Brain}
        title="Study Planner"
        subtitle="Plan your study sessions and track progress"
        gradient="linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(45 93% 47% / 0.1))"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground font-display">Today's Schedule</h2>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
          
          <div className="glass rounded-2xl p-6 space-y-4">
            {todayTasks.map((task, index) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  task.completed ? 'bg-primary/5' : 'bg-muted/50'
                }`}
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{task.time}</span>
                    <span>•</span>
                    <span>{task.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Weekly Goals</h2>
          <div className="glass rounded-2xl p-6 space-y-6">
            {weeklyGoals.map((item, index) => (
              <div key={item.goal}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-foreground">{item.goal}</span>
                  <span className="text-sm text-primary font-medium">{item.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(199 89% 48%), hsl(263 70% 58%))' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default StudyPlanner;
