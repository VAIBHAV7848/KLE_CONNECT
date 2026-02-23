import { useState, useEffect, useRef } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import {
    ShieldCheck, Users, Video, AlertCircle, TrendingUp,
    MessageSquare, Calendar, Trash2, Power, CheckCircle2,
    Activity, BarChart3, Bell, Lock, Globe, Command,
    RefreshCcw, UserMinus, ShieldAlert, Zap, X, LogIn, LogOut, History, UserPlus, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeDashboardStats } from '@/hooks/useRealtimeDashboardStats';
import SystemSecrets from '@/components/admin/SystemSecrets';
import AIAnalytics from '@/components/admin/AIAnalytics';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
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

interface BroadcastData {
    message: string;
    timestamp: number;
    active: boolean;
    sentBy: string;
    endedAt?: number;
    stoppedBy?: string;
}

interface SystemSettings {
    id: number;
    broadcast?: BroadcastData;
    lockdown?: boolean;
    maintenance?: boolean;
}

const Admin = () => {
    const { toast } = useToast();
    const { role: currentAdminRole, user: currentUser, isOwner: iAmOwner } = useAuth();
    const { stats: dashboardStats } = useRealtimeDashboardStats();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms' | 'moderation' | 'login_history' | 'system_config' | 'analytics'>('overview');
    const [isLive, setIsLive] = useState(true);
    const [isLockdownActive, setIsLockdownActive] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    // Real functional logic states
    const [broadcast, setBroadcast] = useState('');
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [stats, setStats] = useState<AdminStat[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loginHistory, setLoginHistory] = useState<any[]>([]);

    // Add User modal states (Owner only)
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('student');
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Rate limiters for security
    const broadcastLimiter = useRef(new RateLimiter(10, 60000)); // 10 broadcasts per minute
    const lockdownLimiter = useRef(new RateLimiter(5, 60000)); // 5 lockdown toggles per minute

    // 1. Initialize data and persistence
    useEffect(() => {
        // Load Broadcast from Supabase (GLOBAL)
        const loadBroadcast = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('broadcast')
                    .eq('id', 1)
                    .maybeSingle();

                if (error) {
                    console.warn('[Admin] Broadcast fetch:', error.message);
                    return;
                }

                if (data?.broadcast?.active) {
                    setBroadcast(data.broadcast.message);
                } else {
                    setBroadcast('');
                }
            } catch (error) {
                console.error('[Admin] Error fetching broadcast:', error);
            }
        };

        loadBroadcast();

        // Subscribe to broadcast changes
        const broadcastSubscription = supabase
            .channel('broadcast_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'system_settings', filter: 'id=eq.1' },
                (payload) => {
                    let newData = payload.new as any;
                    let bcast = newData?.broadcast;
                    if (typeof bcast === 'string') {
                        try {
                            bcast = JSON.parse(bcast);
                        } catch (e) {
                            // ignore parse error or old string format
                        }
                    }
                    if (bcast && typeof bcast === 'object' && bcast.active) {
                        setBroadcast(bcast.message);
                    } else {
                        setBroadcast('');
                    }
                }
            )
            .subscribe();

        // Load Users (for management tab) — uses profiles table
        const loadUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*');

                if (error) {
                    console.warn('[Admin] Profiles fetch:', error.message);
                    return;
                }

                if (data) {
                    const userList: ManagedUser[] = data.map((user: any) => ({
                        id: user.id,
                        name: user.display_name || user.full_name || 'Unknown User',
                        email: user.email || 'No Email',
                        role: user.role || 'student',
                        status: user.status || 'Active',
                        isOwner: user.is_owner === true || user.role === 'super_admin'
                    }));
                    setUsers(userList);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error('[Admin] Error fetching users:', error);
                toast({
                    title: "Access Error",
                    description: "Could not load user directory. Check Supabase permissions.",
                    variant: "destructive"
                });
            }
        };

        loadUsers();

        // Subscribe to profile changes for live user directory
        const usersSubscription = supabase
            .channel('profiles_changes_admin')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    loadUsers();
                }
            )
            .subscribe();

        // Load Rooms from Supabase (real-time active study rooms)
        const loadRooms = async () => {
            try {
                const { data, error } = await supabase
                    .from('rooms')
                    .select('*');

                if (error) throw error;

                if (data) {
                    const roomsList = data
                        .filter(room => (room.participants || 0) > 0)
                        .map(room => ({
                            id: room.id,
                            name: room.name || 'Unnamed Room',
                            topic: room.topic || 'General',
                            host: 'Student',
                            participants: room.participants || 0,
                            uptime: Math.floor((Date.now() - new Date(room.created_at || Date.now()).getTime()) / 60000) + 'm'
                        }));

                    setRooms(roomsList);
                } else {
                    setRooms([]);
                }
            } catch (error) {
                console.error('[Admin] Error fetching rooms:', error);
            }
        };

        loadRooms();

        // Subscribe to rooms changes
        const roomsSubscription = supabase
            .channel('rooms_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'rooms' },
                () => {
                    loadRooms();
                }
            )
            .subscribe();

        // Load Lockdown State from Supabase (GLOBAL)
        const loadLockdown = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('lockdown')
                    .eq('id', 1)
                    .maybeSingle();

                if (error) {
                    console.warn('[Admin] Lockdown fetch:', error.message);
                    return;
                }

                setIsLockdownActive(data?.lockdown === true);
            } catch (error) {
                console.error('[Admin] Error fetching lockdown state:', error);
            }
        };

        loadLockdown();

        // Subscribe to lockdown changes
        const lockdownSubscription = supabase
            .channel('lockdown_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'system_settings', filter: 'id=eq.1' },
                (payload) => {
                    const newData = payload.new as SystemSettings;
                    setIsLockdownActive(newData?.lockdown === true);
                }
            )
            .subscribe();

        // Stats are now handled by useRealtimeDashboardStats hook.
        // No manual doubt counting or subscription needed here.

        // Load Audit Logs (for Session Activity monitor)
        const loadAuditLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(10);

                if (error) throw error;

                if (data) {
                    setAuditLogs(data);
                } else {
                    setAuditLogs([]);
                }
            } catch (error) {
                console.error('[Admin] Error fetching audit logs:', error);
            }
        };

        loadAuditLogs();

        // Subscribe to audit_logs changes
        const auditSubscription = supabase
            .channel('audit_logs_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'audit_logs' },
                () => {
                    loadAuditLogs();
                }
            )
            .subscribe();

        // Load Login History
        const loadLoginHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('login_history')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(50);

                if (error) throw error;
                setLoginHistory(data || []);
            } catch (error) {
                console.error('[Admin] Error fetching login history:', error);
            }
        };

        loadLoginHistory();

        // Subscribe to login_history for live updates
        const loginHistorySubscription = supabase
            .channel('login_history_admin')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'login_history' },
                (payload) => {
                    setLoginHistory(prev => [payload.new, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        // Cleanup Supabase subscriptions on unmount
        return () => {
            broadcastSubscription.unsubscribe();
            usersSubscription.unsubscribe();
            roomsSubscription.unsubscribe();
            lockdownSubscription.unsubscribe();
            auditSubscription.unsubscribe();
            loginHistorySubscription.unsubscribe();
        };
    }, []);

    // Derive UI stat cards from the realtime hook
    useEffect(() => {
        setStats([
            { label: 'Total Students', value: dashboardStats.totalStudents.toLocaleString(), trend: '+ Live', icon: Users, color: 'text-blue-400' },
            { label: 'Active Sessions', value: dashboardStats.activeSessions, trend: 'Live', icon: Activity, color: 'text-green-400' },
            { label: 'Doubts Posted', value: dashboardStats.doubtsPosted.toLocaleString(), trend: 'Total', icon: MessageSquare, color: 'text-purple-400' },
            { label: 'System Load', value: dashboardStats.systemLoad, trend: 'Minimal', icon: BarChart3, color: 'text-yellow-400' },
        ]);
    }, [dashboardStats]);

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

        const payload: BroadcastData = {
            message: sanitizedMessage,
            timestamp: Date.now(),
            active: true,
            sentBy: 'Admin'
        };

        try {
            // Update in Supabase
            const { error } = await supabase
                .from('system_settings')
                .update({ broadcast: payload })
                .eq('id', 1);

            if (error) throw error;

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
            const payload: BroadcastData = {
                message: broadcast,
                timestamp: Date.now(),
                active: false,
                endedAt: Date.now(),
                stoppedBy: currentUser?.uid || 'unknown',
                sentBy: 'Admin'
            };

            const { error } = await supabase
                .from('system_settings')
                .update({ broadcast: payload })
                .eq('id', 1);

            if (error) throw error;

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
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    actor_id: currentUser?.uid || 'unknown',
                    actor_email: currentUser?.email || 'unknown',
                    role: currentAdminRole,
                    action,
                    target_id: targetId,
                    details,
                    blocked: wasBlocked,
                    timestamp: new Date().toISOString()
                });

            if (error) throw error;
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

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id);

            if (error) throw error;

            logAdminAction('change_role', id, `Changed role to ${newRole}`);
            toast({ title: "Role Updated", description: `User promoted to ${newRole}.` });
        } catch (error) {
            logAdminAction('change_role', id, `Supabase Write Error: ${error}`, true);
            toast({ title: "Update Failed", description: "Database rule prevented this action.", variant: "destructive" });
        }
    };

    const toggleUserStatus = async (id: string) => {
        const userToUpdate = users.find(u => u.id === id);
        if (!userToUpdate) return;

        const nextStatus = userToUpdate.status === 'Active' ? 'Suspended' : 'Active';

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: nextStatus })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "User Status Updated", description: `User marked as ${nextStatus}.` });
        } catch (error) {
            console.error('Error updating user status:', error);
            toast({
                title: "Update Failed",
                description: "Could not update user status.",
                variant: "destructive"
            });
        }
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

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            logAdminAction('delete_user', id, "User deleted successfully");
            toast({ title: "User Revoked", description: "Student access has been permanently removed from the portal." });
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({ title: "Delete Failed", description: "Database rule prevented this action.", variant: "destructive" });
        }
    };

    // --- ADD NEW USER (Owner-only) ---
    const addNewUser = async () => {
        if (!iAmOwner) {
            toast({ title: "Permission Denied", description: "Only the Platform Owner can add new users.", variant: "destructive" });
            return;
        }

        if (!newUserEmail.trim() || !newUserPassword.trim()) {
            toast({ title: "Missing Fields", description: "Email and password are required.", variant: "destructive" });
            return;
        }

        if (newUserPassword.length < 6) {
            toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setIsAddingUser(true);
        try {
            // Step 1: Create auth user via signUp
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: newUserEmail.trim(),
                password: newUserPassword,
                options: {
                    data: {
                        display_name: newUserName.trim() || newUserEmail.split('@')[0],
                    }
                }
            });

            if (signUpError) throw signUpError;

            const newUserId = signUpData.user?.id;
            if (!newUserId) throw new Error('User creation returned no ID');

            // Step 2: Update the profile with role and display_name
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: newUserId,
                    email: newUserEmail.trim(),
                    display_name: newUserName.trim() || newUserEmail.split('@')[0],
                    role: newUserRole,
                    status: 'Active',
                });

            if (profileError) console.warn('Profile update warning:', profileError);

            logAdminAction('add_user', newUserId, `Created user: ${newUserEmail} with role: ${newUserRole}`);
            toast({
                title: "User Created",
                description: `${newUserEmail} has been registered as ${newUserRole}. They may need to verify their email.`,
            });

            // Reset form
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserName('');
            setNewUserRole('student');
            setShowAddUserModal(false);
            loadUsers();
        } catch (error: any) {
            console.error('Error creating user:', error);
            logAdminAction('add_user', 'N/A', `Failed to create user: ${error.message}`, true);
            toast({
                title: "User Creation Failed",
                description: error.message || "Could not create the user.",
                variant: "destructive"
            });
        } finally {
            setIsAddingUser(false);
        }
    };

    const terminateRoom = async (id: string) => {
        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', id);

            if (error) throw error;

            logAdminAction('terminate_room', id, 'Room terminated by admin');
            toast({
                title: "Session Terminated",
                description: `Intercepted and killed Room ${id} successfully. Stream terminated.`,
            });
        } catch (error) {
            console.error('Error terminating room:', error);
            toast({
                title: "Kill Failed",
                description: "Permission denied or network error.",
                variant: "destructive"
            });
        }
    };

    const triggerMaintenance = async () => {
        const nextState = !isLive;
        setIsLive(nextState);

        try {
            const { error } = await supabase
                .from('system_settings')
                .update({ maintenance: !nextState })
                .eq('id', 1);

            if (error) throw error;

            toast({
                title: nextState ? "System Operational" : "Maintenance Mode ACTIVE",
                description: nextState ? "All normal services restored." : "Access restricted for global maintenance.",
                variant: nextState ? "default" : "destructive"
            });
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            toast({
                title: "Action Failed",
                description: "Could not update maintenance mode.",
                variant: "destructive"
            });
        }
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

        try {
            const { error } = await supabase
                .from('system_settings')
                .update({ lockdown: nextState })
                .eq('id', 1);

            if (error) throw error;

            if (nextState) {
                // Activate Lockdown
                toast({
                    title: "EMERGENCY LOCKDOWN ACTIVATED",
                    description: "All student accounts suspended globally. Sessions terminated. Only admins can access the platform.",
                    variant: "destructive"
                });
            } else {
                // Deactivate Lockdown
                toast({
                    title: "LOCKDOWN DEACTIVATED",
                    description: "Normal operations restored globally. All student accounts reactivated.",
                });
            }
        } catch (error) {
            console.error('Error toggling lockdown:', error);
            setIsLockdownActive(!nextState); // Revert state on error
            toast({
                title: "Action Failed",
                description: "Could not update lockdown state.",
                variant: "destructive"
            });
        }
    };

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-blue-500 rounded-full" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">System Terminal v4.0</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
                            Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Control</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-medium tracking-wide max-w-md">
                            Centralized college ecosystem management and security oversight.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div
                            onClick={triggerMaintenance}
                            className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 cursor-pointer backdrop-blur-2xl px-5 py-3 rounded-[20px] border border-white/10 transition-all active:scale-95 shadow-2xl shadow-black/20"
                        >
                            <div className={cn("w-2 h-2 rounded-full relative", isLive ? "bg-emerald-500" : "bg-rose-500")}>
                                <div className={cn("absolute inset-0 rounded-full animate-ping opacity-40", isLive ? "bg-emerald-400" : "bg-rose-400")} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-300">
                                {isLive ? 'Operational' : 'Maintenance Mode'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 1. Pro Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                            className="relative group"
                        >
                            {/* Card Glow Effect */}
                            <div className={cn("absolute -inset-0.5 rounded-[32px] opacity-0 group-hover:opacity-20 transition duration-500 blur-xl",
                                stat.color.replace('text-', 'bg-')
                            )} />

                            <div className="relative glass p-6 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent h-full flex flex-col justify-between overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-700">
                                    <stat.icon className="w-24 h-24" />
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <div className={cn("p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10", stat.color)}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                                            stat.trend.includes('+') || stat.trend.includes('Live') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-400 border border-white/10'
                                        )}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-3xl font-black tracking-tight text-white mb-1">{stat.value}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em]">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 2. Professional Navigation */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 p-1.5 bg-white/[0.03] backdrop-blur-3xl rounded-[24px] w-fit border border-white/5 mx-auto md:mx-0 shadow-2xl">
                    {[
                        { id: 'overview', label: 'Command Hub', icon: Globe },
                        { id: 'users', label: 'User Directory', icon: Users },
                        { id: 'rooms', label: 'Active Meetings', icon: Video },
                        { id: 'moderation', label: 'Security Lab', icon: Lock },
                        { id: 'login_history', label: 'Login History', icon: History },
                        ...(iAmOwner ? [
                            { id: 'system_config', label: 'System Config', icon: ShieldCheck },
                            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                        ] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative px-6 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 group overflow-hidden",
                                activeTab === tab.id
                                    ? "text-white"
                                    : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="nav_active"
                                    className={cn(
                                        "absolute inset-0 z-0",
                                        tab.id === 'system_config' ? "bg-rose-500/20" :
                                            tab.id === 'login_history' ? "bg-emerald-500/20" : "bg-white/[0.08]"
                                    )}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className={cn(
                                "w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110",
                                (tab.id === 'system_config' || tab.id === 'analytics') && "text-rose-500",
                                tab.id === 'login_history' && "text-emerald-400",
                                activeTab === tab.id && "text-blue-400"
                            )} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 3. Terminal View */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Priority Control Center */}
                                <div className="lg:col-span-2 relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl -z-10" />

                                    <div className="glass rounded-[40px] p-10 border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent shadow-2xl relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                                            <Globe className="w-64 h-64" />
                                        </div>

                                        <div className="flex items-center justify-between mb-10">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                                        <Zap className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-white">Priority Broadcast</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium ml-12">Authorized system message propagation</p>
                                            </div>

                                            {broadcast && (
                                                <Button
                                                    onClick={clearBroadcast}
                                                    disabled={isStopping}
                                                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-6 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                                >
                                                    {isStopping ? "TERMINATING..." : "EMERGENCY STOP"}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-blue-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                                <textarea
                                                    value={broadcast}
                                                    onChange={(e) => setBroadcast(e.target.value)}
                                                    className="relative w-full h-44 bg-black/40 border border-white/10 rounded-[24px] p-6 text-sm focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-gray-700 leading-relaxed font-medium"
                                                    placeholder="Type official notification for immediate broadcast..."
                                                />
                                            </div>

                                            <Button
                                                onClick={handlePushBroadcast}
                                                disabled={!broadcast.trim()}
                                                className="w-full bg-blue-600 hover:bg-blue-500 h-16 rounded-[24px] gap-3 font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                            >
                                                <Globe className="w-4 h-4" /> Push Priority Broadcast
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Modernized System Log */}
                                <div className="glass rounded-[40px] p-10 border border-white/10 bg-black/20 shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                            Live Monitor
                                        </h3>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>

                                    <div className="space-y-6 relative">
                                        <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

                                        {[
                                            { msg: 'Broadcast synchronized', time: '1m ago', color: 'text-emerald-500', icon: CheckCircle2 },
                                            { msg: 'Persistence updated', time: '12m ago', color: 'text-blue-400', icon: Activity },
                                            { msg: 'Monitoring agent active', time: '1h ago', color: 'text-amber-500', icon: ShieldAlert },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-6 pl-1 group cursor-default">
                                                <div className={cn("relative z-10 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/10", item.color)}>
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black tracking-wide text-gray-200 group-hover:text-white transition-colors uppercase">{item.msg}</p>
                                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{item.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Network Load</span>
                                            <span className="text-[10px] font-mono text-emerald-400">Stable</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full w-[14%] bg-gradient-to-r from-emerald-500 to-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-[40px] border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl"
                            >
                                <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-white/[0.02] to-transparent">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white tracking-tight">Managed Student Database</h3>
                                        <p className="text-xs text-gray-500 font-medium">Directory of all registered campus identities</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="bg-black/20 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{users.length} Users Found</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-2xl h-10 px-5 border-white/10 glass hover:bg-white/10 transition-all font-bold text-[11px] uppercase tracking-wider" onClick={() => window.location.reload()}>
                                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Refresh
                                        </Button>
                                        {iAmOwner && (
                                            <Button
                                                onClick={() => setShowAddUserModal(true)}
                                                className="rounded-2xl h-10 px-5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all font-black text-[11px] uppercase tracking-wider"
                                            >
                                                <UserPlus className="w-3.5 h-3.5 mr-2" /> Register User
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                                                <th className="py-6 px-10 border-b border-white/5">Identity</th>
                                                <th className="py-6 px-10 border-b border-white/5">Contact Point</th>
                                                <th className="py-6 px-10 border-b border-white/5">Authorization</th>
                                                <th className="py-6 px-10 border-b border-white/5">Vitality</th>
                                                <th className="py-6 px-10 border-b border-white/5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {users.map(user => (
                                                <tr key={user.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                                    <td className="py-6 px-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center text-xs font-black border border-white/10 group-hover:border-blue-500/30 transition-all">
                                                                    {user.name[0]}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#09090b]" />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-200 tracking-tight">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-10 text-xs text-gray-400 font-mono tracking-tighter">{user.email}</td>
                                                    <td className="py-6 px-10">
                                                        {user.isOwner ? (
                                                            <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-2 w-fit shadow-lg shadow-purple-500/5">
                                                                <ShieldCheck className="w-3 h-3" /> Platform Oracle
                                                            </span>
                                                        ) : (currentAdminRole === 'super_admin' && (iAmOwner || user.role !== 'super_admin')) ? (
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase font-black rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-blue-500/20 transition-all appearance-none tracking-widest text-center min-w-[120px]"
                                                            >
                                                                <option value="student">Student</option>
                                                                <option value="moderator">Moderator</option>
                                                                <option value="ops_admin">Ops Admin</option>
                                                                <option value="super_admin">Super Admin</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 tracking-widest">
                                                                {user.role}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-6 px-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                                                                user.status === 'Active' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                                                    user.status === 'Flagged' ? 'bg-amber-500 animate-pulse shadow-amber-500/40' : 'bg-rose-500 shadow-rose-500/40'
                                                            )} />
                                                            <span className={cn("text-[10px] font-black uppercase tracking-wider",
                                                                user.status === 'Active' ? 'text-emerald-400' :
                                                                    user.status === 'Flagged' ? 'text-amber-400' : 'text-rose-400'
                                                            )}>{user.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-10">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                disabled={user.isOwner || (user.role === 'super_admin' && !iAmOwner)}
                                                                onClick={() => toggleUserStatus(user.id)}
                                                                variant="ghost" size="icon"
                                                                className={cn("h-9 w-9 rounded-xl transition-all", user.status === 'Suspended' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/5 text-amber-400 border border-amber-500/10')}
                                                            >
                                                                {user.status === 'Suspended' ? <Power className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                                            </Button>
                                                            {iAmOwner && (
                                                                <Button
                                                                    disabled={user.isOwner}
                                                                    onClick={() => deleteUser(user.id)}
                                                                    variant="ghost" size="icon"
                                                                    className="h-9 w-9 rounded-xl transition-all bg-rose-500/5 text-gray-500 hover:text-rose-500 border border-white/5 hover:border-rose-500/20"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add User Modal (Owner Only) */}
                                <AnimatePresence>
                                    {showAddUserModal && iAmOwner && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                                            onClick={() => setShowAddUserModal(false)}
                                        >
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full max-w-md mx-4 glass rounded-[32px] border border-white/10 bg-[#0c0c0d]/95 shadow-2xl overflow-hidden"
                                            >
                                                {/* Modal Header */}
                                                <div className="flex items-center justify-between p-8 pb-4 border-b border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                                            <UserPlus className="w-5 h-5 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-white">Register New User</h3>
                                                            <p className="text-[10px] text-gray-500 font-medium">Create a new campus identity</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setShowAddUserModal(false)} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                                                        <X className="w-5 h-5 text-gray-500" />
                                                    </button>
                                                </div>

                                                {/* Modal Body */}
                                                <div className="p-8 space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                                                        <input
                                                            type="text"
                                                            value={newUserName}
                                                            onChange={(e) => setNewUserName(e.target.value)}
                                                            placeholder="Full name (optional)"
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address *</label>
                                                        <input
                                                            type="email"
                                                            value={newUserEmail}
                                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                                            placeholder="student@klescet.ac.in"
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password *</label>
                                                        <div className="relative">
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                value={newUserPassword}
                                                                onChange={(e) => setNewUserPassword(e.target.value)}
                                                                placeholder="Min 6 characters"
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 pr-12 text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                                                required
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                                            >
                                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                                                        <select
                                                            value={newUserRole}
                                                            onChange={(e) => setNewUserRole(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer transition-all appearance-none"
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="moderator">Moderator</option>
                                                            <option value="ops_admin">Ops Admin</option>
                                                            <option value="super_admin">Super Admin</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Modal Footer */}
                                                <div className="p-8 pt-4 border-t border-white/5 flex gap-3">
                                                    <Button
                                                        onClick={() => setShowAddUserModal(false)}
                                                        variant="outline"
                                                        className="flex-1 rounded-2xl h-12 border-white/10 glass hover:bg-white/10 font-black text-[11px] uppercase tracking-wider"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={addNewUser}
                                                        disabled={isAddingUser || !newUserEmail.trim() || !newUserPassword.trim()}
                                                        className="flex-1 rounded-2xl h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-40"
                                                    >
                                                        {isAddingUser ? (
                                                            <span className="flex items-center gap-2">
                                                                <RefreshCcw className="w-4 h-4 animate-spin" /> Creating...
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2">
                                                                <UserPlus className="w-4 h-4" /> Create User
                                                            </span>
                                                        )}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {activeTab === 'rooms' && (
                            <motion.div
                                key="rooms"
                                initial={{ opacity: 0, scale: 0.99 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-1 bg-blue-500 rounded-full" />
                                        <div>
                                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                                Live Grid Monitor
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium tracking-wide">Persistent viewport into active study cohorts</p>
                                        </div>
                                    </div>
                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl px-5 py-2.5 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
                                        <span className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em]">{rooms.length} NODES ONLINE</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {rooms.length === 0 ? (
                                        <div className="col-span-full py-32 text-center glass rounded-[40px] border border-dashed border-white/10 bg-white/[0.01]">
                                            <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                <Video className="w-10 h-10 text-gray-600" />
                                            </div>
                                            <p className="text-lg font-black text-gray-400 uppercase tracking-widest">Static Environment</p>
                                            <p className="text-sm text-gray-600 font-medium">No system-level activity detected on the mesh.</p>
                                        </div>
                                    ) : (
                                        rooms.map(room => (
                                            <div key={room.id} className="glass rounded-[36px] p-8 border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-2xl relative group overflow-hidden transition-all hover:border-blue-500/20 hover:scale-[1.02] duration-500">
                                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.06] group-hover:rotate-12 group-hover:scale-125 transition-all duration-700 pointer-events-none">
                                                    <Video className="w-48 h-48" />
                                                </div>

                                                <div className="flex justify-between items-start mb-10 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-[20px] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                                            <Video className="w-7 h-7" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h4 className="font-black text-xl text-gray-100 tracking-tight group-hover:text-white transition-colors capitalize">{room.name}</h4>
                                                            <p className="text-[9px] text-gray-500 font-black tracking-[0.15em] uppercase">UID: {room.id.substring(0, 10)}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            terminateRoom(room.id);
                                                        }}
                                                        variant="ghost"
                                                        className="h-10 w-10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[14px] border border-rose-500/20 glass"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-3 gap-6 border-t border-white/[0.05] pt-8 relative z-10">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Load</p>
                                                        <p className="text-sm font-black text-emerald-400 tracking-tight">{room.participants} USERS</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Authority</p>
                                                        <p className="text-sm font-black text-white/80 tracking-tight truncate">{room.host || 'STUDENT'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Uptime</p>
                                                        <p className="text-sm font-black text-gray-400 tracking-tight font-mono">{room.uptime}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-8">
                                                    <Button className="w-full bg-white/5 hover:bg-blue-600 text-gray-400 hover:text-white border border-white/5 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">
                                                        Attach to Session
                                                    </Button>
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                            >
                                {/* Advanced Audit Facility */}
                                <div className="glass rounded-[40px] p-10 border border-white/10 bg-white/[0.01] shadow-2xl space-y-8">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                                <Activity className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Audit Stream</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time system actions</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    </div>

                                    <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                                        {auditLogs.length === 0 ? (
                                            <div className="py-20 text-center opacity-30">
                                                <p className="text-xs font-black uppercase tracking-widest">Buffer Empty</p>
                                            </div>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <div key={log.id} className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-300">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("w-2 h-10 rounded-full",
                                                            log.blocked ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                                log.action.includes('push') ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                                        )} />
                                                        <div>
                                                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-200">{log.action.replace(/_/g, ' ')}</p>
                                                            <p className="text-[9px] text-gray-600 font-mono mt-1">OBJ: {log.target_id || log.targetId}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                                            {Math.floor((Date.now() - log.timestamp) / 60000)}m
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Security Response Facility */}
                                <div className="space-y-8">
                                    <div className={cn(
                                        "glass rounded-[40px] p-10 border border-white/10 shadow-2xl transition-all duration-700 relative overflow-hidden",
                                        isLockdownActive
                                            ? "bg-rose-600/10 border-rose-500/30"
                                            : "bg-white/[0.01]"
                                    )}>
                                        {isLockdownActive && (
                                            <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                                        )}

                                        <div className="flex items-center justify-between mb-10 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-3 rounded-2xl transition-colors", isLockdownActive ? "bg-rose-500/20 text-rose-500" : "bg-gray-500/10 text-gray-500")}>
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className={cn("text-xl font-black uppercase tracking-tight", isLockdownActive ? "text-rose-500" : "text-white")}>
                                                        Emergency Response
                                                    </h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Protocol Zero</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                                                <div className={cn("w-2 h-2 rounded-full", isLockdownActive ? "bg-rose-500 animate-ping" : "bg-gray-600")} />
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest", isLockdownActive ? "text-rose-500" : "text-gray-500")}>
                                                    {isLockdownActive ? "ENGAGED" : "DORMANT"}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-400 font-medium mb-10 leading-relaxed border-l-2 border-white/5 pl-6 relative z-10">
                                            Activating Global Lockdown will instantly suspend all non-admin account vitality and terminally close all active data streams.
                                        </p>

                                        <Button
                                            onClick={toggleLockdown}
                                            variant={isLockdownActive ? "default" : "destructive"}
                                            className={cn(
                                                "w-full h-16 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] transition-all relative z-10",
                                                isLockdownActive
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20"
                                            )}
                                        >
                                            {isLockdownActive ? "Disengage Lockdown" : "Initiate Protocol Zero"}
                                        </Button>
                                    </div>

                                    {/* Sub-panels Grid */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.02]">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Lock className="w-4 h-4 text-emerald-400" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auth Buffer</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full w-full bg-emerald-500/40" />
                                                </div>
                                                <p className="text-[11px] font-black text-gray-200">2FA Enforced</p>
                                            </div>
                                        </div>
                                        <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.02]">
                                            <div className="flex items-center gap-3 mb-6">
                                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Firewall</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full w-3/4 bg-blue-500/40" />
                                                </div>
                                                <p className="text-[11px] font-black text-gray-200">Active Shield</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'login_history' && (
                            <motion.div
                                key="login_history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-[40px] border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl"
                            >
                                <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-emerald-500/5 to-transparent">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                                <History className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-tight">Live Login History</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium ml-12">Real-time record of all authentication events across the platform</p>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <div className="bg-black/20 border border-emerald-500/20 rounded-2xl px-4 py-2 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">LIVE SYNC</span>
                                        </div>
                                        <div className="bg-black/20 border border-white/10 rounded-2xl px-4 py-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{loginHistory.length} Events</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                                                <th className="py-6 px-10 border-b border-white/5">Event</th>
                                                <th className="py-6 px-10 border-b border-white/5">User</th>
                                                <th className="py-6 px-10 border-b border-white/5">Method</th>
                                                <th className="py-6 px-10 border-b border-white/5">Timestamp</th>
                                                <th className="py-6 px-10 border-b border-white/5">Device</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {loginHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                                            <History className="w-12 h-12" />
                                                            <p className="text-xs font-black uppercase tracking-widest">No events recorded yet</p>
                                                            <p className="text-xs text-gray-500">Events will appear here as users log in/out</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                loginHistory.map((entry) => {
                                                    const isSignIn = entry.event_type !== 'SIGNED_OUT';
                                                    const eventLabels: Record<string, string> = {
                                                        'SIGNED_IN': 'Sign In',
                                                        'EMAIL_LOGIN': 'Email Login',
                                                        'GOOGLE_LOGIN': 'Google Login',
                                                        'PHONE_LOGIN': 'Phone Login',
                                                        'GUEST_LOGIN': 'Guest Login',
                                                        'SIGNED_OUT': 'Sign Out',
                                                        'TOKEN_REFRESHED': 'Token Refresh',
                                                    };
                                                    const ts = entry.timestamp ? new Date(entry.timestamp) : new Date();
                                                    const timeAgo = Math.floor((Date.now() - ts.getTime()) / 60000);
                                                    const timeStr = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`;
                                                    const shortAgent = entry.user_agent ? (
                                                        entry.user_agent.includes('Chrome') ? 'Chrome' :
                                                            entry.user_agent.includes('Firefox') ? 'Firefox' :
                                                                entry.user_agent.includes('Safari') ? 'Safari' :
                                                                    entry.user_agent.includes('Edge') ? 'Edge' : 'Browser'
                                                    ) + (entry.user_agent.includes('Mobile') ? ' / Mobile' : ' / Desktop') : 'Unknown';

                                                    return (
                                                        <tr key={entry.id} className="group hover:bg-white/[0.02] transition-all duration-200">
                                                            <td className="py-5 px-10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-xl flex items-center justify-center border",
                                                                        isSignIn
                                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                                    )}>
                                                                        {isSignIn ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-[11px] font-black uppercase tracking-wider",
                                                                        isSignIn ? 'text-emerald-400' : 'text-rose-400'
                                                                    )}>
                                                                        {eventLabels[entry.event_type] || entry.event_type}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-10">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-xs font-bold text-gray-200">{entry.user_name || 'Unknown'}</p>
                                                                    <p className="text-[10px] font-mono text-gray-500">{entry.user_email || 'No email'}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-10">
                                                                <span className={cn(
                                                                    "text-[9px] font-black uppercase px-2.5 py-1 rounded-full border tracking-widest",
                                                                    entry.event_type === 'GOOGLE_LOGIN' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                                        entry.event_type === 'GUEST_LOGIN' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                                                            entry.event_type === 'PHONE_LOGIN' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                                                                entry.event_type === 'TOKEN_REFRESHED' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                                                    isSignIn ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                                )}>
                                                                    {entry.event_type === 'GOOGLE_LOGIN' ? 'Google' :
                                                                        entry.event_type === 'GUEST_LOGIN' ? 'Anonymous' :
                                                                            entry.event_type === 'PHONE_LOGIN' ? 'OTP' :
                                                                                entry.event_type === 'TOKEN_REFRESHED' ? 'Refresh' : 'Email'}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-10">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[11px] font-bold text-gray-300">{timeStr}</p>
                                                                    <p className="text-[9px] font-mono text-gray-600">{ts.toLocaleString()}</p>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-10">
                                                                <span className="text-[10px] font-mono text-gray-500">{shortAgent}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
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

                        {activeTab === 'analytics' && iAmOwner && (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <ErrorBoundary>
                                    <AIAnalytics />
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
