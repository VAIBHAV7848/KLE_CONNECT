import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import {
    ShieldCheck, Users, Video, AlertCircle, TrendingUp,
    MessageSquare, Calendar, Trash2, Power, CheckCircle2,
    Activity, BarChart3, Bell, Lock, Globe, Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminStat {
    label: string;
    value: string | number;
    trend: string;
    icon: any;
    color: string;
}

const Admin = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'moderation'>('overview');
    const [isLive, setIsLive] = useState(true);

    // Stats Data
    const stats: AdminStat[] = [
        { label: 'Total Students', value: '1,284', trend: '+12%', icon: Users, color: 'text-blue-400' },
        { label: 'Active Sessions', value: '42', trend: 'Live', icon: Activity, color: 'text-green-400' },
        { label: 'Doubts Resolved', value: '85%', trend: '+5%', icon: MessageSquare, color: 'text-purple-400' },
        { label: 'System Load', value: '14%', trend: 'Minimal', icon: BarChart3, color: 'text-yellow-400' },
    ];

    // Mock Data for Tabs
    const mockUsers = [
        { id: '1', name: 'Vaibhav', email: 'vaibhav@kle.edu', role: 'Admin', status: 'Active' },
        { id: '2', name: 'Student 7848', email: 'student@kle.edu', role: 'Student', status: 'Active' },
        { id: '3', name: 'Test User', email: 'test@gmail.com', role: 'Student', status: 'Flagged' },
    ];

    const mockRooms = [
        { id: 'RM-502', name: 'DSA Study Group', host: 'Vaibhav', participants: 12, uptime: '45m' },
        { id: 'RM-201', name: 'Thermodynamics Exam', host: 'Rahul', participants: 4, uptime: '12m' },
    ];

    const handleAction = (action: string) => {
        toast({
            title: "Admin Action Triggered",
            description: `Action: ${action} has been executed successfully.`,
        });
    };

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        icon={ShieldCheck}
                        title="Admin Mission Control"
                        subtitle="Campus-wide oversight and system management"
                        gradient="linear-gradient(135deg, hsl(0 100% 50% / 0.2), hsl(217 91% 60% / 0.1))"
                    />

                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 self-start md:self-auto">
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isLive ? "bg-green-500" : "bg-red-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System: {isLive ? 'Operational' : 'Maintenance'}</span>
                    </div>
                </div>

                {/* 1. Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5",
                                    stat.trend.includes('+') ? 'text-green-400' : 'text-gray-400'
                                )}>
                                    {stat.trend}
                                </span>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight">{stat.value}</h4>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>

                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-24 h-24" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 2. Management Navigation */}
                <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl w-fit border border-white/5 mx-auto md:mx-0">
                    {[
                        { id: 'overview', label: 'Overview', icon: Globe },
                        { id: 'users', label: 'Student Mgmt', icon: Users },
                        { id: 'rooms', label: 'Live Rooms', icon: Video },
                        { id: 'moderation', label: 'Security', icon: Lock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white shadow-lg border border-white/10"
                                    : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 3. Terminal View */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                {/* News Flash Broadcast */}
                                <div className="lg:col-span-2 glass rounded-[32px] p-8 border border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Bell className="w-6 h-6 text-yellow-500" />
                                        <h3 className="text-xl font-bold">Campus-Wide Announcement</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">Broadcast a message to all student dashboards immediately.</p>
                                    <textarea
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:ring-blue-500/20 mb-4"
                                        placeholder="E.g. Engineering Block B will be closed for maintenance tomorrow..."
                                    />
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl gap-3 font-bold uppercase tracking-widest text-xs">
                                        <Globe className="w-4 h-4" /> Push Global Broadcast
                                    </Button>
                                </div>

                                {/* System Activity */}
                                <div className="glass rounded-[32px] p-8 border border-white/5">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        Recent Activity
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { msg: 'New student registered', time: '2m ago', icon: CheckCircle2, color: 'text-green-500' },
                                            { msg: 'Room RM-502 flagged', time: '14m ago', icon: AlertCircle, color: 'text-red-500' },
                                            { msg: 'Global update pushed', time: '1h ago', icon: Command, color: 'text-blue-500' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className={cn("p-2 rounded-lg bg-white/5", item.color)}>
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{item.msg}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter mt-1">{item.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div
                                key="users"
                                className="glass rounded-[32px] p-8 border border-white/5 overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold">Student Database</h3>
                                    <Button variant="outline" size="sm" className="rounded-xl">Export CSV</Button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-black">
                                                <th className="pb-4 px-4">Name</th>
                                                <th className="pb-4 px-4">Email</th>
                                                <th className="pb-4 px-4">Role</th>
                                                <th className="pb-4 px-4">Status</th>
                                                <th className="pb-4 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {mockUsers.map(user => (
                                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 px-4 text-sm font-bold">{user.name}</td>
                                                    <td className="py-4 px-4 text-xs text-gray-400">{user.email}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? 'bg-green-500' : 'bg-red-500')} />
                                                            <span className="text-xs font-medium">{user.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                                <Settings className="w-4 h-4 text-gray-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'rooms' && (
                            <motion.div
                                key="rooms"
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {mockRooms.map(room => (
                                    <div key={room.id} className="glass rounded-3xl p-6 border border-white/5 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-5">
                                            <Video className="w-32 h-32" />
                                        </div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                    <Video className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{room.name}</h4>
                                                    <p className="text-[10px] text-gray-500 font-mono">ID: {room.id}</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => handleAction(`Shutdown ${room.id}`)} variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 rounded-xl">
                                                Terminate
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-black">Participants</p>
                                                <p className="text-sm font-bold mt-1 text-green-400">{room.participants} Online</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-black">Host</p>
                                                <p className="text-sm font-bold mt-1">{room.host}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-black">Uptime</p>
                                                <p className="text-sm font-bold mt-1 text-gray-300">{room.uptime}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </PageLayout>
    );
};

const Settings = (props: any) => <Activity {...props} />;

export default Admin;
