import React, { useState } from 'react';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Key, Lock, Eye, EyeOff, Save, Trash2, ShieldAlert, Cpu, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SystemSecrets: React.FC = () => {
    const { isOwner, user } = useAuth();
    const { secrets, loading, addSecret, updateSecret, deleteSecret } = useSystemConfig();

    if (!user || !isOwner) return null;

    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const toggleVisibility = (keyName: string) => {
        const newSet = new Set(visibleKeys);
        if (newSet.has(keyName)) newSet.delete(keyName);
        else newSet.add(keyName);
        setVisibleKeys(newSet);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName || !newKeyValue) return;
        try {
            await addSecret(newKeyName, newKeyValue);
            setNewKeyName('');
            setNewKeyValue('');
        } catch (err) {
            console.error('[SystemSecrets] Failed to add secret:', err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Security Vault Header */}
            <div className="glass rounded-[40px] p-10 border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                    <ShieldAlert size={180} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[18px] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
                                <Shield className="text-rose-500 w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Platform S-Tier Configuration</h2>
                                <p className="text-xs text-rose-500/60 font-black tracking-widest uppercase mt-1">Authorized Personnel Only • Tier 0 Clearance Required</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 font-medium max-w-xl leading-relaxed">
                            Primary interface for managing encrypted environmental vectors and critical API endpoints. Improper modification may result in immediate platform-wide service termination.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 px-8 py-5 bg-black/40 rounded-[24px] border border-white/5 border-dashed">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Validated
                            </p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Identity</p>
                            <p className="text-xs font-black text-gray-200 uppercase tracking-widest">Platform Oracle</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Secret Injection Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                            <Terminal className="w-4 h-4 text-blue-400" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Secret Injection</h3>
                        </div>
                        
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Key Reference</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    placeholder="GROQ_API_KEY"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none font-mono text-xs transition-all placeholder:text-gray-700 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Sensitive Vector</label>
                                <input
                                    type="text"
                                    value={newKeyValue}
                                    onChange={e => setNewKeyValue(e.target.value)}
                                    placeholder="sk_live_..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-rose-500/50 focus:outline-none font-mono text-xs transition-all placeholder:text-gray-700 shadow-inner"
                                />
                            </div>
                            
                            <Button
                                type="submit"
                                disabled={!newKeyName || !newKeyValue}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-[18px] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98]"
                            >
                                <Save size={16} className="mr-2" /> Commit to Vault
                            </Button>
                        </form>
                    </div>
                    
                    <div className="glass rounded-[32px] p-8 border border-amber-500/10 bg-amber-500/[0.02]">
                        <div className="flex gap-4">
                            <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 font-mono">Warning Protocol</p>
                                <p className="text-[10px] text-amber-500/60 font-bold leading-relaxed uppercase tracking-tighter">Modification of core environment variables may trigger temporary platform instability while kernels propagate.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secure Inventory */}
                <div className="lg:col-span-2 glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Key Mesh</h3>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{secrets.length} Nodes Loaded</span>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Synchronizing Secure Streams...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {secrets.map((secret) => (
                                <div key={secret.keyName} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-[24px] opacity-0 group-hover:opacity-100 transition duration-500 blur-sm" />
                                    <div className="relative flex items-center justify-between p-6 rounded-[24px] bg-black/40 border border-white/5 backdrop-blur-3xl transition-all duration-300 group-hover:border-white/10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                                    <Key size={14} className="text-amber-400" />
                                                </div>
                                                <span className="font-mono text-xs font-black text-gray-200 uppercase tracking-tight truncate">{secret.keyName}</span>
                                            </div>
                                            
                                            {editingKey === secret.keyName ? (
                                                <div className="flex gap-2 mt-4 animate-in slide-in-from-left-2 duration-300">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        className="flex-1 bg-black/40 border border-blue-500/30 rounded-xl px-4 py-2 text-white text-xs font-mono outline-none"
                                                        autoFocus
                                                    />
                                                    <Button onClick={() => {
                                                        updateSecret(secret.keyName, editValue);
                                                        setEditingKey(null);
                                                    }} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 h-9 rounded-xl text-[9px] uppercase font-black px-4">Apply</Button>
                                                    <Button onClick={() => setEditingKey(null)} variant="ghost" className="h-9 rounded-xl text-[9px] uppercase font-black text-gray-500 hover:text-white px-4">Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 bg-black/20 p-2.5 rounded-[18px] border border-white/[0.02]">
                                                    <code className="text-gray-500 text-[10px] font-mono tracking-tighter truncate flex-1 block overflow-hidden">
                                                        {visibleKeys.has(secret.keyName) ? secret.keyValue : '••••••••••••••••••••••••••••••••••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => toggleVisibility(secret.keyName)}
                                                        className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-600 hover:text-white shrink-0"
                                                    >
                                                        {visibleKeys.has(secret.keyName) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 shrink-0">
                                            <Button
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => {
                                                    setEditingKey(secret.keyName);
                                                    setEditValue(secret.keyValue);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/10"
                                            >
                                                <Lock size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(`Permanent deletion of ${secret.keyName}?`)) deleteSecret(secret.keyName);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {secrets.length === 0 && (
                                <div className="py-20 text-center opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest">No keys found in current mesh buffer.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemSecrets;
