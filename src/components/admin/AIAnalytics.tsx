import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, AlertCircle, Clock, Zap, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnalyticsData {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    providerBreakdown: { provider: string; count: number; success: number }[];
    dailyStats: { date: string; requests: number; errors: number }[];
    recentErrors: { provider: string; error: string; timestamp: string }[];
}

const AIAnalytics: React.FC = () => {
    const { isOwner } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

    if (!isOwner) return null;

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Fetch usage stats
            const { data: usageData, error } = await supabase
                .from('ai_usage_stats')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (usageData) {
                const totalRequests = usageData.length;
                const successfulRequests = usageData.filter(u => u.success).length;
                const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
                
                const avgResponseTime = totalRequests > 0 
                    ? Math.round(usageData.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / totalRequests)
                    : 0;

                // Provider breakdown
                const providerMap = new Map();
                usageData.forEach(u => {
                    const existing = providerMap.get(u.provider) || { count: 0, success: 0 };
                    providerMap.set(u.provider, {
                        count: existing.count + 1,
                        success: existing.success + (u.success ? 1 : 0)
                    });
                });
                
                const providerBreakdown = Array.from(providerMap.entries()).map(([provider, stats]) => ({
                    provider,
                    count: stats.count,
                    success: Math.round((stats.success / stats.count) * 100)
                })).sort((a, b) => b.count - a.count);

                // Daily stats
                const dailyMap = new Map();
                usageData.forEach(u => {
                    const date = new Date(u.created_at).toLocaleDateString();
                    const existing = dailyMap.get(date) || { requests: 0, errors: 0 };
                    dailyMap.set(date, {
                        requests: existing.requests + 1,
                        errors: existing.errors + (u.success ? 0 : 1)
                    });
                });
                
                const dailyStats = Array.from(dailyMap.entries())
                    .map(([date, stats]) => ({ date, ...stats }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(-7);

                // Recent errors
                const recentErrors = usageData
                    .filter(u => !u.success && u.error_message)
                    .slice(0, 5)
                    .map(u => ({
                        provider: u.provider,
                        error: u.error_message,
                        timestamp: new Date(u.created_at).toLocaleString()
                    }));

                setAnalytics({
                    totalRequests,
                    successRate,
                    avgResponseTime,
                    providerBreakdown,
                    dailyStats,
                    recentErrors
                });
            }
        } catch (err) {
            console.error('[AIAnalytics] Failed to fetch analytics:', err);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!analytics || analytics.totalRequests === 0) {
        return (
            <div className="text-center py-16">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">No Analytics Data</p>
                <p className="text-xs text-gray-600 mt-2">Start using the AI Tutor to see usage statistics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 w-fit">
                {(['24h', '7d', '30d'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                            timeRange === range
                                ? "bg-blue-500 text-white"
                                : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                    </button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={BarChart3}
                    label="Total Requests"
                    value={analytics.totalRequests.toLocaleString()}
                    color="text-blue-400"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Success Rate"
                    value={`${analytics.successRate.toFixed(1)}%`}
                    color={analytics.successRate >= 95 ? 'text-emerald-400' : analytics.successRate >= 80 ? 'text-yellow-400' : 'text-rose-400'}
                />
                <StatCard
                    icon={Clock}
                    label="Avg Response Time"
                    value={`${analytics.avgResponseTime}ms`}
                    color="text-purple-400"
                />
                <StatCard
                    icon={Zap}
                    label="Active Providers"
                    value={analytics.providerBreakdown.length.toString()}
                    color="text-orange-400"
                />
            </div>

            {/* Provider Breakdown */}
            <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Provider Usage</h3>
                </div>
                <div className="space-y-3">
                    {analytics.providerBreakdown.map((provider) => (
                        <div key={provider.provider} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-200">{provider.provider}</span>
                                    <span className="text-xs font-mono text-gray-500">{provider.count.toLocaleString()} requests</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            provider.success >= 95 ? 'bg-emerald-500' : provider.success >= 80 ? 'bg-yellow-500' : 'bg-rose-500'
                                        )}
                                        style={{ width: `${provider.success}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">{provider.success}% success rate</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Stats Chart */}
            {analytics.dailyStats.length > 0 && (
                <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Daily Activity</h3>
                    </div>
                    <div className="h-40 flex items-end gap-2">
                        {analytics.dailyStats.map((day, index) => {
                            const maxRequests = Math.max(...analytics.dailyStats.map(d => d.requests));
                            const height = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col gap-1 justify-end h-32">
                                        <div
                                            className="w-full bg-emerald-500/50 rounded-t-md transition-all duration-500"
                                            style={{ height: `${height}%` }}
                                            title={`${day.requests} requests`}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-500 rotate-45 origin-left translate-y-2">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Errors */}
            {analytics.recentErrors.length > 0 && (
                <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Recent Errors</h3>
                    </div>
                    <div className="space-y-3">
                        {analytics.recentErrors.map((error, index) => (
                            <div key={index} className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-rose-400">{error.provider}</span>
                                    <span className="text-[10px] font-mono text-gray-500">{error.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono truncate">{error.error}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}> = ({ icon: Icon, label, value, color }) => (
    <div className="glass rounded-[24px] p-6 border border-white/10 bg-white/[0.01]">
        <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2 rounded-lg bg-white/5", color)}>
                <Icon size={16} />
            </div>
        </div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{label}</p>
    </div>
);

export default AIAnalytics;
