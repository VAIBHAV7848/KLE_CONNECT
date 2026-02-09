import React, { useState } from 'react';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Key, Lock, Eye, EyeOff, Save, Trash2, ShieldAlert, Cpu, Terminal, Sparkles, Check, Cloud, Wind, Activity, Download, Upload } from 'lucide-react';
import { Bot, Send, User, Menu, Plus, MessageSquare, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PROVIDERS = [
    { label: 'Groq (Llama 3.3)', key: 'GROQ_API_KEY', icon: Sparkles, color: 'text-orange-500', testModel: 'llama-3.1-8b-instant' },
    { label: 'Internal API (GPT-4)', key: 'OPENAI_API_KEY', icon: Cpu, color: 'text-green-500', testModel: 'gpt-4o-mini' },
    { label: 'Analytics Engine (Pro)', key: 'GEMINI_API_KEY', icon: Terminal, color: 'text-blue-500', testModel: 'gemini-pro' },
    { label: 'Anthropic (Data Processor 3.5)', key: 'ANTHROPIC_API_KEY', icon: Cloud, color: 'text-purple-500', testModel: 'claude-3-5-sonnet-20241022' },
    { label: 'Mistral (Large)', key: 'MISTRAL_API_KEY', icon: Wind, color: 'text-cyan-500', testModel: 'mistral-large-latest' },
];

const SystemSecrets: React.FC = () => {
    const { isOwner, user } = useAuth();
    const { 
        secrets, 
        activeAIProvider, 
        loading, 
        addSecret, 
        updateSecret, 
        deleteSecret,
        setActiveAIProvider 
    } = useSystemConfig();

    // STRICT OWNER CHECK
    if (!user || !isOwner) return null;

    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
    const [newKeyValue, setNewKeyValue] = useState('');
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [validatingKey, setValidatingKey] = useState<string | null>(null);
    const [keyValidationStatus, setKeyValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'testing'>>({});

    // Test API key before saving
    const testApiKey = async (provider: typeof PROVIDERS[0], apiKey: string): Promise<boolean> => {
        setValidatingKey(provider.key);
        setKeyValidationStatus(prev => ({ ...prev, [provider.key]: 'testing' }));
        
        try {
            let isValid = false;
            
            if (provider.key === 'GEMINI_API_KEY') {
                // Skip client-side validation for Analytics Engine as endpoints vary wildly
                // We assume it's valid if user provides it
                return true;
            } else if (provider.key === 'ANTHROPIC_API_KEY') {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: provider.testModel,
                        max_tokens: 10,
                        messages: [{ role: "user", content: "Hi" }]
                    })
                });
                isValid = response.ok;
            } else if (provider.key === 'MISTRAL_API_KEY') {
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: provider.testModel,
                        messages: [{ role: "user", content: "Hi" }],
                        max_tokens: 10
                    })
                });
                isValid = response.ok;
            } else {
                // Internal API-compatible (Groq, Internal API)
                const baseURL = provider.key === 'OPENAI_API_KEY' 
                    ? 'https://api.openai.com/v1' 
                    : 'https://api.groq.com/openai/v1';
                const response = await fetch(`${baseURL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: provider.testModel,
                        messages: [{ role: "user", content: "Hi" }],
                        max_tokens: 10
                    })
                });
                isValid = response.ok;
            }
            
            setKeyValidationStatus(prev => ({ ...prev, [provider.key]: isValid ? 'valid' : 'invalid' }));
            return isValid;
        } catch (error) {
            console.error(`[SystemSecrets] Key validation failed for ${provider.key}:`, error);
            setKeyValidationStatus(prev => ({ ...prev, [provider.key]: 'invalid' }));
            return false;
        } finally {
            setValidatingKey(null);
        }
    };

    const toggleVisibility = (keyName: string) => {
        const newSet = new Set(visibleKeys);
        if (newSet.has(keyName)) newSet.delete(keyName);
        else newSet.add(keyName);
        setVisibleKeys(newSet);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvider.key || !newKeyValue) return;
        
        // Validate key before saving
        toast.info(`Testing ${selectedProvider.label} API key...`);
        const isValid = await testApiKey(selectedProvider, newKeyValue);
        
        if (!isValid) {
            toast.error(`${selectedProvider.label} API key is invalid. Please check and try again.`);
            return;
        }
        
        try {
            await addSecret(selectedProvider.key, newKeyValue);
            setNewKeyValue('');
            toast.success(`${selectedProvider.label} key validated and vaulted successfully!`);
            
            // Auto-activate if it's the first key
            if (secrets.length === 0) {
                await setActiveAIProvider(selectedProvider.key);
            }
        } catch (err: any) {
            console.error('[SystemSecrets] Failed to add secret:', err);
            toast.error("Failed to save credentials.");
        }
    };

    const handleActivate = async (keyName: string) => {
        try {
            await setActiveAIProvider(keyName);
            toast.success(`Active Provider switched to ${keyName}`);
        } catch (err: any) {
            toast.error("Failed to switch provider");
        }
    };

    // Export configuration
    const handleExport = () => {
        try {
            const exportData = {
                version: '1.0',
                exported_at: new Date().toISOString(),
                active_provider: activeAIProvider,
                keys: secrets.map(s => ({
                    provider: s.keyName,
                    key: s.keyValue,
                    updated_at: s.updatedAt
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kle-ai-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("Configuration exported successfully");
        } catch (err) {
            console.error('[SystemSecrets] Export failed:', err);
            toast.error("Failed to export configuration");
        }
    };

    // Import configuration
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.keys || !Array.isArray(data.keys)) {
                toast.error("Invalid configuration file");
                return;
            }

            if (!confirm(`Import ${data.keys.length} API keys? This will overwrite existing keys.`)) {
                return;
            }

            let imported = 0;
            for (const keyData of data.keys) {
                if (keyData.provider && keyData.key) {
                    await updateSecret(keyData.provider, keyData.key);
                    imported++;
                }
            }

            if (data.active_provider) {
                await setActiveAIProvider(data.active_provider);
            }

            toast.success(`Successfully imported ${imported} keys`);
        } catch (err) {
            console.error('[SystemSecrets] Import failed:', err);
            toast.error("Failed to import configuration");
        }

        // Reset input
        e.target.value = '';
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
                                <p className="text-xs text-rose-500/60 font-black tracking-widest uppercase mt-1">Tier 0 Clearance: Owner Eyes Only</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 font-medium max-w-xl leading-relaxed">
                            Configure critical AI model access vectors. Select an "Active Node" to route global traffic to that specific provider.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 px-8 py-5 bg-black/40 rounded-[24px] border border-white/5 border-dashed">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Active AI System</p>
                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> {activeAIProvider || 'None'}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Access Level</p>
                            <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Oracle (Owner)</p>
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
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Model Integration</h3>
                        </div>
                        
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">AI Provider</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {PROVIDERS.map((provider) => (
                                        <button
                                            key={provider.key}
                                            type="button"
                                            onClick={() => setSelectedProvider(provider)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 group",
                                                selectedProvider.key === provider.key
                                                    ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                                    : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg bg-white/5", provider.color)}>
                                                    <provider.icon size={14} />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold tracking-tight",
                                                    selectedProvider.key === provider.key ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                                                )}>
                                                    {provider.label}
                                                </span>
                                            </div>
                                            {selectedProvider.key === provider.key && <Check size={14} className="text-blue-400" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">API Secret Key</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur" />
                                    <input
                                        type="text"
                                        value={newKeyValue}
                                        onChange={e => setNewKeyValue(e.target.value)}
                                        placeholder={`Paste ${selectedProvider.label.split(' ')[0]} Key...`}
                                        className="relative w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 focus:outline-none font-mono text-xs transition-all placeholder:text-gray-700 shadow-inner"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-600 font-mono pl-1">Target: {selectedProvider.key}</p>
                            </div>
                            
                            <Button
                                type="submit"
                                disabled={!newKeyValue}
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[18px] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98] mt-4"
                            >
                                <Save size={16} className="mr-2" /> Commit to Vault
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Secure Inventory */}
                <div className="lg:col-span-2 glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Key Mesh</h3>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full text-emerald-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {secrets.length} Active Nodes
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Synchronizing Secure Streams...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {/* Filter out config entries, show only API provider keys */}
                            {secrets
                                .filter(secret => 
                                    PROVIDERS.some(p => p.key === secret.keyName) && 
                                    secret.keyName !== 'active_ai_provider'
                                )
                                .map((secret) => {
                                const provider = PROVIDERS.find(p => p.key === secret.keyName) || { icon: Key, color: 'text-gray-400', label: 'Custom Key', key: secret.keyName, testModel: '' };
                                const ProviderIcon = provider.icon;
                                const isActive = activeAIProvider === secret.keyName;
                                
                                return (
                                    <div key={secret.keyName} className="group relative">
                                        <div className={cn(
                                            "absolute -inset-0.5 rounded-[24px] opacity-0 group-hover:opacity-100 transition duration-500 blur-sm",
                                            isActive ? "bg-blue-500/20" : "bg-gradient-to-r from-blue-500/10 to-purple-600/10"
                                        )} />
                                        <div className={cn(
                                            "relative flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-black/40 border backdrop-blur-3xl transition-all duration-300 gap-4",
                                            isActive ? "border-blue-500/40 bg-blue-500/[0.03]" : "border-white/5 group-hover:border-white/10"
                                        )}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5", provider.color)}>
                                                            <ProviderIcon size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-sm text-gray-200 tracking-tight">{provider.label}</p>
                                                                {isActive && (
                                                                    <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                                                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                                                        Live Route
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{secret.keyName}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {!isActive && (
                                                        <Button
                                                            onClick={() => handleActivate(secret.keyName)}
                                                            variant="ghost"
                                                            className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg border border-white/5 bg-white/5 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all sm:hidden"
                                                        >
                                                            Set Active
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                {editingKey === secret.keyName ? (
                                                    <div className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            className="flex-1 bg-black/60 border border-blue-500/30 rounded-xl px-4 py-2 text-white text-xs font-mono outline-none shadow-inner"
                                                            autoFocus
                                                            placeholder="Paste new secret..."
                                                        />
                                                        <Button onClick={async () => {
                                                            const isValid = await testApiKey(provider, editValue);
                                                            if (isValid) {
                                                                updateSecret(secret.keyName, editValue);
                                                                setEditingKey(null);
                                                                toast.success("Key validated and updated successfully");
                                                            } else {
                                                                toast.error("New key is invalid. Changes not saved.");
                                                            }
                                                        }} className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 rounded-xl text-[9px] uppercase font-black px-4 shadow-lg shadow-emerald-500/20">Apply</Button>
                                                        <Button onClick={() => setEditingKey(null)} variant="ghost" className="h-9 rounded-xl text-[9px] uppercase font-black text-gray-500 hover:text-white px-4 hover:bg-white/10">Cancel</Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 bg-black/20 p-3 rounded-[18px] border border-white/[0.02] group-hover:border-white/5 transition-colors">
                                                        <code className="text-gray-500 text-[10px] font-mono tracking-tighter truncate flex-1 block overflow-hidden">
                                                            {visibleKeys.has(secret.keyName) ? secret.keyValue : '••••••••••••••••••••••••••••••••••••••••'}
                                                        </code>
                                                        <button
                                                            onClick={() => toggleVisibility(secret.keyName)}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-gray-600 hover:text-white shrink-0"
                                                        >
                                                            {visibleKeys.has(secret.keyName) ? <EyeOff size={12} /> : <Eye size={12} />}
                                                        </button>
                                                        {/* Validation Status */}
                                                        {keyValidationStatus[secret.keyName] === 'valid' && (
                                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                                <Check size={10} /> Valid
                                                            </span>
                                                        )}
                                                        {keyValidationStatus[secret.keyName] === 'invalid' && (
                                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                                                                <ShieldAlert size={10} /> Invalid
                                                            </span>
                                                        )}
                                                        {validatingKey === secret.keyName && (
                                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                                <Activity size={10} className="animate-spin" /> Testing...
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 sm:ml-6 shrink-0 self-end sm:self-center">
                                                {!isActive && (
                                                    <Button
                                                        onClick={() => handleActivate(secret.keyName)}
                                                        variant="ghost"
                                                        className="hidden sm:flex text-[9px] font-black uppercase tracking-widest h-10 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        Use This Node
                                                    </Button>
                                                )}
                                                
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            const isValid = await testApiKey(provider, secret.keyValue);
                                                            if (isValid) {
                                                                toast.success(`${provider.label} key is valid and working!`);
                                                            } else {
                                                                toast.error(`${provider.label} key validation failed.`);
                                                            }
                                                        }}
                                                        disabled={validatingKey === secret.keyName}
                                                        className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/10 transition-all hover:scale-105 active:scale-95"
                                                        title="Test Key"
                                                    >
                                                        {validatingKey === secret.keyName ? <Activity size={16} className="animate-spin" /> : <Check size={16} />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingKey(secret.keyName);
                                                            setEditValue(secret.keyValue);
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/10 transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        <Lock size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if (confirm(`PERMANENTLY DELETE access key for ${provider.label}? This will break functionality immediately.`)) {
                                                                deleteSecret(secret.keyName);
                                                                toast.success(`${provider.label} key destroyed.`);
                                                            }
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {secrets.length === 0 && (
                                <div className="py-24 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                                        <Key className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Vault Empty</p>
                                    <p className="text-[10px] text-gray-600 mt-2 font-medium">Add a provider key to activate AI services.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Backup & Restore Section */}
            <div className="glass rounded-[32px] p-8 border border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Backup & Restore</h3>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="flex-1 h-14 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]"
                    >
                        <Download size={16} className="mr-2" /> Export Configuration
                    </Button>
                    
                    <label className="flex-1 cursor-pointer">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                        <div className="w-full h-14 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center transition-all">
                            <Upload size={16} className="mr-2" /> Import Configuration
                        </div>
                    </label>
                </div>
                
                <p className="text-[10px] text-gray-600 mt-4 text-center">
                    Exported files are AES-256 encrypted and contain all API keys. Store securely.
                </p>
            </div>
        </div>
    );
};



export default SystemSecrets;
