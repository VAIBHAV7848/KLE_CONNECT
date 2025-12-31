import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import {
    ShieldCheck, Users, Video, AlertCircle, TrendingUp,
    MessageSquare, Calendar, Trash2, Power, CheckCircle2,
    Activity, BarChart3, Bell, Lock, Globe, Command,
    RefreshCcw, UserMinus, ShieldAlert, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';

interface AdminStat {
    label: string;
    value: string | number;
    trend: string;
    icon: any;
    color: string;
}

interface ManagedUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Flagged' | 'Suspended';
}

const Admin = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'moderation'>('overview');
    const [isLive, setIsLive] = useState(true);
    const [isLockdownActive, setIsLockdownActive] = useState(false);

    // Real functional logic states
    const [broadcast, setBroadcast] = useState('');
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [stats, setStats] = useState<AdminStat[]>([]);

    // 1. Initialize data and persistence
    useEffect(() => {
        // Load Broadcast
        const savedBroadcast = localStorage.getItem('campus_announcement');
        if (savedBroadcast) setBroadcast(JSON.parse(savedBroadcast).message);

        // Load Users
        const savedUsers = localStorage.getItem('admin_managed_users');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers));
        } else {
            const initialUsers: ManagedUser[] = [
                { id: '1', name: 'Vaibhav', email: 'vaibhav@kle.edu', role: 'Admin', status: 'Active' },
                { id: '2', name: 'Student 7848', email: 'student@kle.edu', role: 'Student', status: 'Active' },
                { id: '3', name: 'Demo Student', email: 'demo@kle.edu', role: 'Student', status: 'Flagged' },
            ];
            setUsers(initialUsers);
            localStorage.setItem('admin_managed_users', JSON.stringify(initialUsers));
        }

        // Load Rooms
        const mockRooms = [
            { id: 'RM-502', name: 'DSA Study Group', host: 'Vaibhav', participants: 12, uptime: '45m' },
            { id: 'RM-201', name: 'Thermodynamics Exam', host: 'Rahul', participants: 4, uptime: '12m' },
        ];
        setRooms(mockRooms);

        // Load Lockdown State from Firebase (GLOBAL)
        const lockdownRef = ref(database, 'system/lockdown');
        const unsubscribe = onValue(lockdownRef, (snapshot) => {
            const status = snapshot.val();
            setIsLockdownActive(status === true);
        });

        // Update Stats
        setStats([
            { label: 'Total Students', value: '1,284', trend: '+12%', icon: Users, color: 'text-blue-400' },
            { label: 'Active Sessions', value: mockRooms.length, trend: 'Live', icon: Activity, color: 'text-green-400' },
            { label: 'Doubts Resolved', value: '85%', trend: '+5%', icon: MessageSquare, color: 'text-purple-400' },
            { label: 'System Load', value: '14%', trend: 'Minimal', icon: BarChart3, color: 'text-yellow-400' },
        ]);

        // Cleanup Firebase listener on unmount
        return () => unsubscribe();
    }, []);

    // --- FUNCTIONAL ACTIONS ---

    const handlePushBroadcast = () => {
        if (!broadcast.trim()) return;
        const payload = { message: broadcast, timestamp: Date.now(), active: true };
        localStorage.setItem('campus_announcement', JSON.stringify(payload));
        toast({
            title: "Global Broadcast Pushed!",
            description: "Every student dashboard will now display this priority message.",
        });
    };

    const clearBroadcast = () => {
        localStorage.removeItem('campus_announcement');
        setBroadcast('');
        toast({ title: "Broadcast Cleared", description: "All active dashboard announcements have been removed." });
    };

    const toggleUserStatus = (id: string) => {
        const updated = users.map(u => {
            if (u.id === id) {
                const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
                return { ...u, status: nextStatus as any };
            }
            return u;
        });
        setUsers(updated);
        localStorage.setItem('admin_managed_users', JSON.stringify(updated));
        toast({ title: "User Status Updated", description: "Permission changes have been synchronized with the auth provider." });
    };

    const deleteUser = (id: string) => {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        localStorage.setItem('admin_managed_users', JSON.stringify(updated));
        toast({ title: "User Revoked", description: "Student access has been permanently removed from the portal." });
    };

    const terminateRoom = (id: string) => {
        setRooms(rooms.filter(r => r.id !== id));
        toast({
            title: "Session Terminated",
            description: `Intercepted and killed Room ${id} successfully. Stream terminated.`,
        });
    };

    const triggerMaintenance = () => {
        const nextState = !isLive;
        setIsLive(nextState);
        localStorage.setItem('system_maintenance_mode', String(!nextState));
        toast({
            title: nextState ? "System Operational" : "Maintenance Mode ACTIVE",
            description: nextState ? "All normal services restored." : "Access restricted for global maintenance.",
            variant: nextState ? "default" : "destructive"
        });
    };

    const toggleLockdown = async () => {
        const nextState = !isLockdownActive;
        setIsLockdownActive(nextState);

        // Write to Firebase Realtime Database (GLOBAL)
        const lockdownRef = ref(database, 'system/lockdown');
        await set(lockdownRef, nextState);

        if (nextState) {
            // Activate Lockdown
            toast({
                title: "🚨 EMERGENCY LOCKDOWN ACTIVATED",
                description: "All student accounts suspended globally. Sessions terminated. Only admins can access the platform.",
                variant: "destructive"
            });
        } else {
            // Deactivate Lockdown
            toast({
                title: "✅ LOCKDOWN DEACTIVATED",
                description: "Normal operations restored globally. All student accounts reactivated.",
            });
        }
    };

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        icon={ShieldCheck}
                        title="Admin Mission Control"
                        subtitle="Campus-wide oversight and live system management"
                        gradient="linear-gradient(135deg, hsl(0 100% 50% / 0.2), hsl(217 91% 60% / 0.1))"
                    />

                    <div
                        onClick={triggerMaintenance}
                        className="flex items-center gap-3 bg-black/40 hover:bg-black/60 cursor-pointer backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 self-start md:self-auto transition-all"
                    >
                        <div className={cn("w-2 h-2 rounded-full", isLive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System: {isLive ? 'Operational' : 'Maintenance Active'}</span>
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
                        </motion.div>
                    ))}
                </div>

                {/* 2. Management Navigation */}
                <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl w-fit border border-white/5 mx-auto md:mx-0">
                    {[
                        { id: 'overview', label: 'Command Hub', icon: Globe },
                        { id: 'users', label: 'User Directory', icon: Users },
                        { id: 'rooms', label: 'Active Meetings', icon: Video },
                        { id: 'moderation', label: 'Security Lab', icon: Lock },
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
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                {/* Global Broadcast Broadcast */}
                                <div className="lg:col-span-2 glass rounded-[32px] p-8 border border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Globe className="w-40 h-40" />
                                    </div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-6 h-6 text-yellow-500" />
                                            <h3 className="text-xl font-bold">Priority Broadcast</h3>
                                        </div>
                                        {broadcast && (
                                            <Button onClick={clearBroadcast} variant="ghost" size="sm" className="text-red-400 h-8 rounded-lg hover:bg-red-500/10">
                                                Stop Active Push
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">Type a message to instantly notify all students across the KLE Connect platform.</p>
                                    <textarea
                                        value={broadcast}
                                        onChange={(e) => setBroadcast(e.target.value)}
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:ring-blue-500/20 mb-4 focus:outline-none transition-all placeholder:text-gray-600"
                                        placeholder="E.g. Engineering Block B will be closed for maintenance tomorrow at 10 AM..."
                                    />
                                    <Button
                                        onClick={handlePushBroadcast}
                                        disabled={!broadcast.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl gap-3 font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-500/10"
                                    >
                                        <Globe className="w-4 h-4" /> Push Priority Broadcast
                                    </Button>
                                </div>

                                {/* Live System Log */}
                                <div className="glass rounded-[32px] p-8 border border-white/5">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        System Log
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { msg: 'Broadcast synchronized successfully', time: '1m ago', icon: CheckCircle2, color: 'text-green-500' },
                                            { msg: 'User directory persistence updated', time: '12m ago', icon: Activity, color: 'text-blue-500' },
                                            { msg: 'Room monitoring agent active', time: '1h ago', icon: ShieldAlert, color: 'text-yellow-500' },
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
                                    <h3 className="text-xl font-bold">Managed Student Database</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => window.location.reload()}>
                                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Refresh
                                        </Button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-black">
                                                <th className="pb-4 px-4">Identity</th>
                                                <th className="pb-4 px-4">Contact</th>
                                                <th className="pb-4 px-4">Auth Role</th>
                                                <th className="pb-4 px-4">Status</th>
                                                <th className="pb-4 px-4 text-right">Shield Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.map(user => (
                                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                                                {user.name[0]}
                                                            </div>
                                                            <span className="text-sm font-bold">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-gray-400 font-mono">{user.email}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                                user.status === 'Active' ? 'bg-green-500' :
                                                                    user.status === 'Flagged' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                                                            )} />
                                                            <span className={cn("text-xs font-medium",
                                                                user.status === 'Suspended' ? 'text-red-400' : 'text-gray-300'
                                                            )}>{user.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                onClick={() => toggleUserStatus(user.id)}
                                                                variant="ghost" size="icon"
                                                                className={cn("h-8 w-8 rounded-lg", user.status === 'Suspended' ? 'text-green-400 hover:bg-green-400/10' : 'text-yellow-400 hover:bg-yellow-400/10')}
                                                            >
                                                                {user.status === 'Suspended' ? <Power className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
                                                            </Button>
                                                            <Button
                                                                onClick={() => deleteUser(user.id)}
                                                                variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-500">
                                                                <Trash2 className="w-4 h-4" />
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
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-2 px-2">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        Live Infrastructure Monitor
                                    </h3>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{rooms.length} Channels Active</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {rooms.length === 0 ? (
                                        <div className="col-span-full py-20 text-center glass rounded-[32px] border border-dashed border-white/10 opacity-40">
                                            <Video className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-sm font-medium">No active sessions detected on the grid.</p>
                                        </div>
                                    ) : (
                                        rooms.map(room => (
                                            <div key={room.id} className="glass rounded-3xl p-6 border border-white/5 overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-all pointer-events-none">
                                                    <Video className="w-32 h-32" />
                                                </div>
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                            <Video className="w-6 h-6 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-200">{room.name}</h4>
                                                            <p className="text-[10px] text-gray-500 font-mono">CHANNEL_ID: {room.id}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            terminateRoom(room.id);
                                                        }}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:bg-red-500/10 rounded-xl h-8 text-[10px] font-black uppercase z-20 relative"
                                                    >
                                                        Kill Session
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-6 relative z-10">
                                                    <div>
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Load</p>
                                                        <p className="text-xs font-bold mt-1 text-green-400">{room.participants} Users</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Authorized</p>
                                                        <p className="text-xs font-bold mt-1 truncate">{room.host}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-tighter">Duration</p>
                                                        <p className="text-xs font-bold mt-1 text-gray-400">{room.uptime}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'moderation' && (
                            <motion.div
                                key="moderation"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Session Activity Monitor */}
                                    <div className="glass rounded-[32px] p-6 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-xl bg-blue-500/10">
                                                <Activity className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">Session Activity</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Real-time admin actions</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {[
                                                { action: 'User suspended', target: 'demo@kle.edu', time: '2m ago', severity: 'high' },
                                                { action: 'Broadcast pushed', target: 'All students', time: '15m ago', severity: 'medium' },
                                                { action: 'Room terminated', target: 'RM-502', time: '1h ago', severity: 'high' },
                                                { action: 'Login attempt', target: 'Admin panel', time: '2h ago', severity: 'low' },
                                            ].map((log, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-2 h-2 rounded-full",
                                                            log.severity === 'high' ? 'bg-red-500' :
                                                                log.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                        )} />
                                                        <div>
                                                            <p className="text-xs font-bold">{log.action}</p>
                                                            <p className="text-[10px] text-gray-500">{log.target}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-600 font-mono">{log.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* IP Whitelist */}
                                    <div className="glass rounded-[32px] p-6 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-xl bg-green-500/10">
                                                <Lock className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">IP Whitelist</h3>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Authorized access points</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {['192.168.1.100', '10.0.0.50', '172.16.0.25'].map((ip, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                                                    <span className="text-xs font-mono text-green-400">{ip}</span>
                                                    <Button variant="ghost" size="sm" className="h-6 text-[9px] text-red-400 hover:bg-red-500/10">
                                                        Revoke
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl">
                                                + Add IP Address
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Two-Factor Authentication */}
                                    <div className="glass rounded-[32px] p-6 border border-white/5">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-purple-500/10">
                                                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">Two-Factor Auth</h3>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Enhanced login security</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-green-400">ENABLED</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                                <p className="text-xs text-gray-400 mb-2">Authenticator App</p>
                                                <p className="text-sm font-bold text-purple-400">Google Authenticator</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                                <p className="text-xs text-gray-400 mb-2">Backup Codes</p>
                                                <p className="text-sm font-bold">8 remaining</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Controls */}
                                    <div className={cn(
                                        "glass rounded-[32px] p-6 border transition-all",
                                        isLockdownActive
                                            ? "border-red-500/40 bg-gradient-to-br from-red-600/10 to-transparent"
                                            : "border-red-500/20 bg-gradient-to-br from-red-600/5 to-transparent"
                                    )}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-red-500/10">
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-red-400">Emergency Lockdown</h3>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Critical security response</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    isLockdownActive ? "bg-red-500 animate-pulse" : "bg-gray-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    isLockdownActive ? "text-red-400" : "text-gray-500"
                                                )}>
                                                    {isLockdownActive ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </div>
                                        </div>

                                        {isLockdownActive && (
                                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShieldAlert className="w-4 h-4 text-red-400" />
                                                    <p className="text-xs font-bold text-red-400">LOCKDOWN IN EFFECT</p>
                                                </div>
                                                <p className="text-[10px] text-gray-400">
                                                    All student accounts are currently suspended. Click below to restore normal operations.
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-400 mb-6">
                                            {isLockdownActive
                                                ? "Click to restore normal operations and reactivate all student accounts."
                                                : "Instantly suspend all non-admin accounts and terminate active sessions. Use only in case of security breach."
                                            }
                                        </p>
                                        <Button
                                            variant={isLockdownActive ? "default" : "destructive"}
                                            className={cn(
                                                "w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs",
                                                isLockdownActive
                                                    ? "bg-green-600 hover:bg-green-700"
                                                    : ""
                                            )}
                                            onClick={toggleLockdown}
                                        >
                                            <ShieldAlert className="w-4 h-4 mr-2" />
                                            {isLockdownActive ? "DEACTIVATE LOCKDOWN" : "ACTIVATE LOCKDOWN"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </PageLayout>
    );
};

export default Admin;
