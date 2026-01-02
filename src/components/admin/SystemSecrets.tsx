import React, { useState } from 'react';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Key, Lock, Eye, EyeOff, Save, Trash2, AlertTriangle } from 'lucide-react';

const SystemSecrets: React.FC = () => {
    const { isOwner } = useAuth();
    const { secrets, loading, addSecret, updateSecret, deleteSecret } = useSystemConfig();

    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // ABSOLUTE SECURITY CHECK
    if (!isOwner) return null;

    const toggleVisibility = (keyName: string) => {
        const newSet = new Set(visibleKeys);
        if (newSet.has(keyName)) {
            newSet.delete(keyName);
        } else {
            newSet.add(keyName);
        }
        setVisibleKeys(newSet);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName || !newKeyValue) return;
        try {
            await addSecret(newKeyName, newKeyValue);
            setNewKeyName('');
            setNewKeyValue('');
            alert('Secret added successfully');
        } catch (err) {
            alert('Failed to add secret');
        }
    };

    const handleUpdate = async (keyName: string) => {
        try {
            await updateSecret(keyName, editValue);
            setEditingKey(null);
            setEditValue('');
        } catch (err) {
            alert('Failed to update secret');
        }
    };

    const handleDelete = async (keyName: string) => {
        if (confirm(`Are you sure you want to permanently delete ${keyName}? This may break platform features.`)) {
            await deleteSecret(keyName);
        }
    };

    return (
        <div className="bg-slate-900 border border-red-900/50 rounded-lg p-6 mb-8 relative overflow-hidden">
            {/* Background Warning Stripe */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Shield size={120} className="text-red-500" />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <Shield className="text-red-500 w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        System Configuration <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">TIER 0</span>
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Manage critical API keys and platform secrets. Changes apply immediately.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-500">Accessing Secure Validation...</div>
            ) : (
                <div className="space-y-6 relative z-10">

                    {/* Add New Secret */}
                    <form onSubmit={handleAdd} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Key Name</label>
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                placeholder="e.g. GEMINI_API_KEY"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none font-mono text-sm"
                            />
                        </div>
                        <div className="flex-[2]">
                            <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Key Value</label>
                            <input
                                type="text"
                                value={newKeyValue}
                                onChange={e => setNewKeyValue(e.target.value)}
                                placeholder="Paste secret here..."
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none font-mono text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
                        >
                            <Save size={16} /> Save
                        </button>
                    </form>

                    {/* List Secrets */}
                    <div className="space-y-3">
                        {secrets.map((secret) => (
                            <div key={secret.keyName} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Key size={14} className="text-yellow-500" />
                                        <span className="font-mono text-yellow-500 font-bold">{secret.keyName}</span>
                                    </div>
                                    {editingKey === secret.keyName ? (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm font-mono"
                                            />
                                            <button onClick={() => handleUpdate(secret.keyName)} className="text-green-400 hover:text-green-300 text-sm">Save</button>
                                            <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white text-sm">Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <code className="text-slate-300 text-sm bg-slate-900 px-2 py-1 rounded">
                                                {visibleKeys.has(secret.keyName) ? secret.keyValue : '••••••••••••••••••••••••••••••••'}
                                            </code>
                                            <button
                                                onClick={() => toggleVisibility(secret.keyName)}
                                                className="text-slate-500 hover:text-white transition"
                                                title="Toggle Visibility"
                                            >
                                                {visibleKeys.has(secret.keyName) ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-600 mt-1">
                                        Updated: {new Date(secret.updatedAt).toLocaleString()}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={() => {
                                            setEditingKey(secret.keyName);
                                            setEditValue(secret.keyValue);
                                        }}
                                        className="p-2 hover:bg-slate-800 rounded text-blue-400"
                                        title="Edit"
                                    >
                                        <Lock size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(secret.keyName)}
                                        className="p-2 hover:bg-slate-800 rounded text-red-400"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {secrets.length === 0 && (
                            <div className="text-center py-4 border border-dashed border-slate-800 rounded text-slate-600">
                                No system secrets configured yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSecrets;
