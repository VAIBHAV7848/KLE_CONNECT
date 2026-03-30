import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Brain, Plus, CheckCircle2, Circle, Clock, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';



interface StudyTask {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

/**
 * Study Planner - Plan and track study sessions
 */
const StudyPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load Tasks + Realtime Subscription
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          const { data, error } = await (supabase.from('planner_tasks') as any)
            .select('*')
            .eq('user_id', user.uid)
            .order('created_at', { ascending: true });

          if (error) throw error;

          if (data) {
            setTasks(data.map((t: any) => ({
              id: t.id,
              title: t.title,
              time: t.time || 'Anytime',
              completed: t.completed
            })));
          }
        } catch (err: any) {
          console.error('Error fetching tasks:', err);
          toast({
            title: 'Failed to load tasks',
            description: err.message,
            variant: 'destructive',
          });
          // Fallback to localStorage on error
          const saved = localStorage.getItem('study-planner-tasks');
          if (saved) setTasks(JSON.parse(saved));
        }
      } else {
        // Guest user - load from localStorage
        const saved = localStorage.getItem('study-planner-tasks');
        if (saved) {
          setTasks(JSON.parse(saved));
        } else {
          setTasks([]);
        }
      }
      setLoading(false);
    };

    loadTasks();

    // Realtime subscription for logged-in users
    if (!user?.uid) return;

    const channel = supabase
      .channel(`planner_tasks_${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_tasks',
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const t = payload.new as any;
            setTasks(prev => {
              if (prev.find(task => task.id === t.id)) return prev;
              return [...prev, { id: t.id, title: t.title, time: t.time || 'Anytime', completed: t.completed }];
            });
          } else if (payload.eventType === 'UPDATE') {
            const t = payload.new as any;
            setTasks(prev => prev.map(task =>
              task.id === t.id ? { id: t.id, title: t.title, time: t.time || 'Anytime', completed: t.completed } : task
            ));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            setTasks(prev => prev.filter(task => task.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.uid, toast]);

  // Sync to localStorage for Guest users
  useEffect(() => {
    if (!user?.uid) {
      localStorage.setItem('study-planner-tasks', JSON.stringify(tasks));
    }
  }, [tasks, user?.uid]);

  const addTask = async () => {
    if (!newTask.trim()) return;

    setActionLoading('add');
    const tempId = crypto.randomUUID();
    const taskData = {
      title: newTask,
      time: newTaskTime || 'Anytime',
      completed: false
    };

    if (user?.uid) {
      try {
        const { data, error } = await (supabase.from('planner_tasks') as any)
          .insert({
            user_id: user.uid,
            title: taskData.title,
            time: taskData.time,
            completed: taskData.completed
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTasks(prev => [...prev, {
            id: data.id,
            title: data.title,
            time: data.time || 'Anytime',
            completed: data.completed
          }]);
        }

        toast({
          title: 'Task added',
          description: 'Your goal has been saved to the cloud.',
        });
      } catch (err: any) {
        toast({
          title: 'Error adding task',
          description: err.message,
          variant: 'destructive',
        });
      }
    } else {
      // Guest local update
      setTasks(prev => [...prev, { id: tempId, ...taskData }]);
    }

    setNewTask("");
    setNewTaskTime("");
    setIsAddOpen(false);
    setActionLoading(null);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setActionLoading(id);
    const newCompleted = !task.completed;

    if (user?.uid) {
      try {
        const { error } = await (supabase.from('planner_tasks') as any)
          .update({ completed: newCompleted })
          .eq('id', id);

        if (error) throw error;

        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
      } catch (err: any) {
        toast({
          title: 'Error updating task',
          description: err.message,
          variant: 'destructive',
        });
      }
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    }
    setActionLoading(null);
  };

  const deleteTask = async (id: string) => {
    setActionLoading(id);
    if (user?.uid) {
      try {
        const { error } = await (supabase.from('planner_tasks') as any)
          .delete()
          .eq('id', id);

        if (error) throw error;

        setTasks(prev => prev.filter(t => t.id !== id));
        toast({
          title: 'Task deleted',
        });
      } catch (err: any) {
        toast({
          title: 'Error deleting task',
          description: err.message,
          variant: 'destructive',
        });
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    setActionLoading(null);
  };

  // Calculate Progress
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <PageLayout>
      <PageHeader
        icon={Brain}
        title="Study Planner"
        subtitle={user ? `Tracking goals for ${user.displayName}` : "Track your daily academic goals"}
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
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <input
                  className="w-24 bg-transparent border-b border-border focus:border-primary outline-none px-2 py-1 text-sm"
                  placeholder="Time (opt)"
                  value={newTaskTime}
                  onChange={e => setNewTaskTime(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <Button size="sm" onClick={addTask} disabled={actionLoading === 'add'}>
                  {actionLoading === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </motion.div>
          )}

          <div className="glass rounded-2xl p-6 space-y-4 min-h-[300px] relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Syncing goals...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <p>No tasks yet. Enjoy your free time! 🎉</p>
              </div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  layout
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all group ${task.completed ? 'bg-primary/5 opacity-60' : 'bg-muted/50 hover:bg-muted/80'
                    }`}
                >
                  <button onClick={() => toggleTask(task.id)} disabled={actionLoading === task.id}>
                    {actionLoading === task.id ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : task.completed ? (
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
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}

            {user && (
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  Cloud Synced
                </div>
                <span>{user.email}</span>
              </div>
            )}
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

            {!user && (
              <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-left">
                <p className="font-semibold text-primary mb-1">💡 Pro-Tip</p>
                <p>Sign in to sync your tasks across devices and never lose your progress!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default StudyPlanner;
