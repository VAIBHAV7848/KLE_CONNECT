import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Brain, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Study Planner - Plan and track study sessions
 */
const StudyPlanner = () => {
  // State
  const [tasks, setTasks] = useState<{ id: string, title: string, time: string, completed: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Load Tasks
  useEffect(() => {
    const saved = localStorage.getItem('study-planner-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      // Default / Onboarding Tasks
      setTasks([]);
    }
  }, []);

  // Save Tasks
  useEffect(() => {
    localStorage.setItem('study-planner-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: crypto.randomUUID(),
      title: newTask,
      time: newTaskTime || 'Anytime',
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask("");
    setNewTaskTime("");
    setIsAddOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Calculate Progress
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <PageLayout>
      <PageHeader
        icon={Brain}
        title="Study Planner"
        subtitle="Track your daily academic goals"
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
            <h2 className="text-xl font-semibold text-foreground font-display">Today's Tasks</h2>
            <Button size="sm" onClick={() => setIsAddOpen(!isAddOpen)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          {/* Add Task Form */}
          {isAddOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass p-4 rounded-xl mb-4 border border-primary/20"
            >
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none px-2 py-1"
                  placeholder="Task description..."
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  autoFocus
                />
                <input
                  className="w-24 bg-transparent border-b border-border focus:border-primary outline-none px-2 py-1 text-sm"
                  placeholder="Time (opt)"
                  value={newTaskTime}
                  onChange={e => setNewTaskTime(e.target.value)}
                />
                <Button size="sm" onClick={addTask}>Save</Button>
              </div>
            </motion.div>
          )}

          <div className="glass rounded-2xl p-6 space-y-4 min-h-[300px]">
            {tasks.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p>No tasks yet. Enjoy your free time! 🎉</p>
              </div>
            )}

            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                layout
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors group ${task.completed ? 'bg-primary/5 opacity-60' : 'bg-muted/50 hover:bg-muted/80'
                  }`}
              >
                <button onClick={() => toggleTask(task.id)}>
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0 hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                  <h3 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{task.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Real Progress Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Daily Progress</h2>
          <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">

            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={351}
                  strokeDashoffset={351 - (351 * progress) / 100}
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-bold">{progress}%</span>
            </div>

            <h3 className="text-lg font-medium mb-1">
              {progress === 100 ? "All Done! 🌟" : progress > 50 ? "Great going!" : "Keep pushing!"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {tasks.length} tasks completed
            </p>

          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default StudyPlanner;
