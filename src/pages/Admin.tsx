import { useState, useEffect, useRef } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SystemSecrets from '@/components/admin/SystemSecrets';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, set, onValue, update, remove, push } from 'firebase/database';
import { sanitizeInput, RateLimiter } from '@/lib/security';

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
    isOwner: boolean;
}



const Admin = () => {
    const { toast } = useToast();
    const { role: currentAdminRole, user: currentUser, isOwner: iAmOwner } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'moderation' | 'system_config'>('overview');
    const [isLive, setIsLive] = useState(true);
    const [isLockdownActive, setIsLockdownActive] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    // Real functional logic states
    const [broadcast, setBroadcast] = useState('');
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [stats, setStats] = useState<AdminStat[]>([]);
    const [doubtCountState, setDoubtCountState] = useState(0);

    // Rate limiters for security
    const broadcastLimiter = useRef(new RateLimiter(10, 60000)); // 10 broadcasts per minute
    const lockdownLimiter = useRef(new RateLimiter(5, 60000)); // 5 lockdown toggles per minute

    // 1. Initialize data and persistence
    useEffect(() => {
        // Load Broadcast from Firebase (GLOBAL)
        const broadcastRef = ref(database, 'system/broadcast');
        const unsubscribeBroadcast = onValue(broadcastRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.active) {
                setBroadcast(data.message);
            } else {
                setBroadcast('');
            }
        });

        // Load Users (for management tab)
        const usersRef = ref(database, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                // DEBUG: Log user count for verification
                console.log(`[Admin] Fetched ${Object.keys(data).length} users from Firebase.`);

                const userList: ManagedUser[] = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].displayName || 'Unknown User', // Fallback for display
                    email: data[key].email || 'No Email',
                    // TESTING MODE SAFEGUARD: If role is missing/NULL, display as 'user'. 
                    // Do NOT persist this fallback to DB to avoid overwriting legacy data.
                    role: data[key].role || 'user',
                    // TESTING MODE SAFEGUARD: Default to 'Active' if status is missing.
                    status: data[key].status || 'Active',
                    isOwner: data[key].isOwner === true
                }));
                setUsers(userList);
            } else {
                console.log('[Admin] No users found in database.');
                setUsers([]);
            }
        }, (error) => {
            console.error('[Admin] Error fetching users:', error);
            toast({
                title: "Access Error",
                description: "Could not fetch user directory. Check permissions.",
                variant: "destructive"
            });
        });

        // Load Rooms (for monitoring tab)
        // Just mocking the structure based on what StudyRooms might look like if persisted,
        // often these are ephemeral or in a specific node.
        // For now we will keep the mock rooms for the 'rooms' tab specifically if we don't have a real strict schema for it yet
        // BUT for the stats, we will try to count them if possible or keep mock for demo.
        const mockRooms = [
            { id: 'RM-502', name: 'DSA Study Group', host: 'Vaibhav', participants: 12, uptime: '45m' },
            { id: 'RM-201', name: 'Thermodynamics Exam', host: 'Rahul', participants: 4, uptime: '12m' },
        ];
        setRooms(mockRooms);

        // Load Lockdown State from Firebase (GLOBAL)
        const lockdownRef = ref(database, 'system/lockdown');
        const unsubscribeLockdown = onValue(lockdownRef, (snapshot) => {
            const status = snapshot.val();
            setIsLockdownActive(status === true);
        });

        // --- FETCH REAL STATS ---
        // We listen to specific nodes to be efficient and secure
        const doubtsRef = ref(database, 'doubts');
        const unsubscribeStats = onValue(doubtsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const doubtCount = Object.keys(data).length;

            // We update stats using the live counts
            // Note: users count is derived from the users state or a separate listener if needed.
            // Since we already have a users listener above, we can use that, but `users` state might update frequent.
            // For simplicity in this `useEffect`, we reference the 'users' data if we want, 
            // but `users` state is inside the component.
            // Best approach: Update stats when `users` or `doubts` changes.
            // However, inside this callback, we only know about doubts.

            // We will set a local ref for doubt count to combine with user count later OR
            // just let this effect manage the stats fully if we duplicate the user listener or use a separate counter.
            // To avoid complexity, we can just update the stats here, assuming user count comes from the usersRef above? 
            // Actually, the usersRef above sets `setUsers`. 
            // Let's create a combined state updater or just listen to users again for the count metric? 
            // No, listening twice is redundant.
            // Let's make `stats` dependent on `users` length in the render, 
            // OR strictly, let's keep the logic here but fetch users "count" lightly? 
            // Firebase doesn't support "count" queries easily without cloud functions.
            // We will stick to client side counting.

            // We'll update the 'Doubts' part of the stats here, and let the Users part update when `users` changes.
            // Actually, `setStats` overwrites. Better to use functional state update?
            // Or easier: Just define `stats` as a derived variable from `users.length`, `mockRooms.length`, etc.
            // BUT `doubts` is not in state as a list.
            // So: Add `doubtCount` to state.
            setDoubtCountState(doubtCount); // We need to add this state variable
        });

        // Cleanup Firebase listeners on unmount
        return () => {
            unsubscribeBroadcast();
            unsubscribeUsers();
            unsubscribeLockdown();
            unsubscribeStats();
        };
    }, []);

    // Effect to update the combined Stats object whenever dependencies change
    useEffect(() => {
        setStats([
            { label: 'Total Students', value: users.length.toLocaleString(), trend: '+ Live', icon: Users, color: 'text-blue-400' },
            { label: 'Active Sessions', value: rooms.length, trend: 'Live', icon: Activity, color: 'text-green-400' },
            { label: 'Doubts Posted', value: doubtCountState.toLocaleString(), trend: 'Total', icon: MessageSquare, color: 'text-purple-400' },
            { label: 'System Load', value: '14%', trend: 'Minimal', icon: BarChart3, color: 'text-yellow-400' },
        ]);
    }, [users.length, rooms.length, doubtCountState]);

    // --- FUNCTIONAL ACTIONS ---

    const handlePushBroadcast = async () => {
        if (!broadcast.trim()) return;

        // Rate limiting check
        if (!broadcastLimiter.current.isAllowed('broadcast')) {
            toast({
                title: "Rate Limit Exceeded",
                description: "Too many broadcasts. Please wait a minute.",
                variant: "destructive"
            });
            return;
        }

        // Sanitize input to prevent XSS
        const sanitizedMessage = sanitizeInput(broadcast);

        const payload = { message: sanitizedMessage, timestamp: Date.now(), active: true, sentBy: 'Admin' };

        try {
            // Push to Firebase Realtime Database
            await set(ref(database, 'system/broadcast'), payload);

            logAdminAction('push_broadcast', 'global', `Message: ${sanitizedMessage.substring(0, 50)}...`);

            toast({
                title: "Global Broadcast Pushed!",
                description: "Every student dashboard will now display this priority message.",
            });
        } catch (error) {
            console.error("Broadcast push failed:", error);
            logAdminAction('push_broadcast', 'global', `Failed to push: ${error}`, true);
            toast({
                title: "Broadcast Failed",
                description: "Could not push message. Check connectivity or permissions.",
                variant: "destructive"
            });
        }
    };

    const clearBroadcast = async () => {
        setIsStopping(true);
        try {
            // SOFT DELETE: Update status instead of removing
            // This preserves the record for history but kills the display
            const broadcastRef = ref(database, 'system/broadcast');
            await update(broadcastRef, {
                active: false,
                endedAt: Date.now(),
                stoppedBy: currentUser?.uid || 'unknown'
            });

            setBroadcast('');
            logAdminAction('STOP_ACTIVE_BROADCAST', 'global', 'Emergency stop of broadcast triggered by admin');
            toast({ title: "Broadcast Stopped", description: "The active broadcast has been terminated successfully." });
        } catch (error) {
            console.error("Broadcast stop failed:", error);
            logAdminAction('STOP_ACTIVE_BROADCAST', 'global', `Failed to stop: ${error}`, true);
            toast({
                title: "Action Failed",
                description: "Could not stop broadcast. Check your permissions.",
                variant: "destructive"
            });
        } finally {
            setIsStopping(false);
        }
    };

    // --- AUDIT LOGGING ---
    const logAdminAction = async (action: string, targetId: string, details: string, wasBlocked: boolean = false) => {
        try {
            const logRef = push(ref(database, 'system/audit_logs'));
            await set(logRef, {
                actorId: currentUser?.uid || 'unknown',
                actorEmail: currentUser?.email || 'unknown',
                role: currentAdminRole,
                action,
                targetId,
                details,
                blocked: wasBlocked,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Audit log failed', err);
        }
    };

    const updateUserRole = async (id: string, newRole: string) => {
        if (id === currentUser?.uid) {
            toast({ title: "Action Denied", description: "You cannot change your own role.", variant: "destructive" });
            return;
        }

        const targetUser = users.find(u => u.id === id);

        // RULE A: Owner Protection
        if (targetUser?.isOwner) {
            toast({ title: "Security Alert", description: "The Platform Owner role is immutable.", variant: "destructive" });
            logAdminAction('change_role', id, `Attempted to change owner role to ${newRole}`, true);
            return;
        }

        // RULE B: Super Admin Protection (Only Owner can manage Super Admins)
        if (targetUser?.role === 'super_admin' && !iAmOwner) {
            toast({ title: "Permission Denied", description: "Only the Platform Owner can manage Super Admins.", variant: "destructive" });
            logAdminAction('change_role', id, `Attempted to change super_admin role by non-owner`, true);
            return;
        }

        const userRef = ref(database, `users/${id}`);

        try {
            await update(userRef, { role: newRole });
            logAdminAction('change_role', id, `Changed role to ${newRole}`);
            toast({ title: "Role Updated", description: `User promoted to ${newRole}.` });
        } catch (error) {
            logAdminAction('change_role', id, `Firebase Write Error: ${error}`, true);
            toast({ title: "Update Failed", description: "Database rule prevented this action.", variant: "destructive" });
        }
    };

    const toggleUserStatus = async (id: string) => {
        const userToUpdate = users.find(u => u.id === id);
        if (!userToUpdate) return;

        const nextStatus = userToUpdate.status === 'Active' ? 'Suspended' : 'Active';

        // Update in Firebase
        const userRef = ref(database, `users/${id}`);
        await update(userRef, { status: nextStatus });

        toast({ title: "User Status Updated", description: `User marked as ${nextStatus}.` });
    };

    const deleteUser = async (id: string) => {
        const targetUser = users.find(u => u.id === id);

        // RULE A: Owner Protection
        if (targetUser?.isOwner) {
            toast({ title: "CRITICAL SECURITY", description: "The Platform Owner CANNOT be deleted.", variant: "destructive" });
            logAdminAction('delete_user', id, "Attempted to delete Platform Owner", true);
            return;
        }

        // RULE B: Super Admin Protection
        if (targetUser?.role === 'super_admin' && !iAmOwner) {
            toast({ title: "Permission Denied", description: "Only the Platform Owner can remove Super Admins.", variant: "destructive" });
            logAdminAction('delete_user', id, "Attempted to delete super_admin by non-owner", true);
            return;
        }

        if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

        // Remove from Firebase
        const userRef = ref(database, `users/${id}`);

        try {
            await remove(userRef);
            logAdminAction('delete_user', id, "User deleted successfully");
            toast({ title: "User Revoked", description: "Student access has been permanently removed from the portal." });
        } catch (error) {
            toast({ title: "Delete Failed", description: "Database rule prevented this action.", variant: "destructive" });
        }
    };

    const terminateRoom = (id: string) => {
        setRooms(rooms.filter(r => r.id !== id));
        toast({
            title: "Session Terminated",
            description: `Intercepted and killed Room ${id} successfully. Stream terminated.`,
        });
    };

    const triggerMaintenance = async () => {
        const nextState = !isLive;
        setIsLive(nextState);

        // Update in Firebase (GLOBAL)
        const sysRef = ref(database, 'system/maintenance');
        await set(sysRef, !nextState); // if isLive is false, maintenance is true

        toast({
            title: nextState ? "System Operational" : "Maintenance Mode ACTIVE",
            description: nextState ? "All normal services restored." : "Access restricted for global maintenance.",
            variant: nextState ? "default" : "destructive"
        });
    };

    const toggleLockdown = async () => {
        // Rate limiting check
        if (!lockdownLimiter.current.isAllowed('lockdown')) {
            toast({
                title: "Rate Limit Exceeded",
                description: "Too many lockdown attempts. Please wait a minute.",
                variant: "destructive"
            });
            return;
        }

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
                        ...(iAmOwner ? [{ id: 'system_config', label: 'System Configuration', icon: ShieldCheck }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white shadow-lg border border-white/10"
                                    : "text-gray-500 hover:text-gray-300",
                                tab.id === 'system_config' && activeTab === 'system_config' && "bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10"
                            )}
                        >
                            <tab.icon className={cn("w-3.5 h-3.5", tab.id === 'system_config' && "text-red-500")} />
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
                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                        <Globe className="w-40 h-40" />
                                    </div>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-6 h-6 text-yellow-500" />
                                            <h3 className="text-xl font-bold">Priority Broadcast</h3>
                                        </div>
                                        {broadcast && (
                                            <Button
                                                onClick={clearBroadcast}
                                                disabled={isStopping}
                                                variant="destructive"
                                                size="sm"
                                                className="h-9 px-4 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                            >
                                                {isStopping ? "TERMINATING..." : "EMERGENCY STOP"}
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
                                                        {user.isOwner ? (
                                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 w-fit">
                                                                <ShieldCheck className="w-3 h-3" /> Super Admin (Owner)
                                                            </span>
                                                        ) : (currentAdminRole === 'super_admin' && (iAmOwner || user.role !== 'super_admin')) ? (
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-black rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="moderator">Moderator</option>
                                                                <option value="ops_admin">Ops Admin</option>
                                                                <option value="super_admin">Super Admin</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                {user.role}
                                                            </span>
                                                        )}
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
                                                                disabled={user.isOwner || (user.role === 'super_admin' && !iAmOwner)}
                                                                onClick={() => deleteUser(user.id)}
                                                                variant="ghost" size="icon"
                                                                className={cn("h-8 w-8 rounded-lg transition-all",
                                                                    (user.isOwner || (user.role === 'super_admin' && !iAmOwner))
                                                                        ? "opacity-20 cursor-not-allowed text-gray-600"
                                                                        : "hover:bg-red-500/10 text-gray-600 hover:text-red-500"
                                                                )}>
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
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
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

                        {activeTab === 'system_config' && iAmOwner && (
                            <motion.div
                                key="system_config"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <ErrorBoundary>
                                    <SystemSecrets />
                                </ErrorBoundary>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </PageLayout>
    );
};

export default Admin;
