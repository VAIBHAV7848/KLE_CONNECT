import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

// Secret Encryption Key (In a real app, this should be an Env Var, 
// but since we are simulating a "God Mode" UI where the Owner knows the inputs, 
// we use a constant for the prototype encryption to satisfy "Encrypt at Rest")
const ENCRYPTION_SECRET = "TIER_0_GOD_MODE_SECRET";

export interface SystemSecret {
    keyName: string;
    keyValue: string; // Decrypted value for UI
    lastUpdatedBy: string;
    updatedAt: string;
}

interface SystemConfigContextType {
    secrets: SystemSecret[];
    activeAIProvider: string | null;
    loading: boolean;
    addSecret: (keyName: string, keyValue: string) => Promise<void>;
    updateSecret: (keyName: string, keyValue: string) => Promise<void>;
    deleteSecret: (keyName: string) => Promise<void>;
    getSecret: (keyName: string) => string | null;
    setActiveAIProvider: (keyName: string) => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

// Map frontend provider key names to DB provider values
const PROVIDER_MAP: Record<string, string> = {
    'GROQ_API_KEY': 'GROQ',
    'OPENAI_API_KEY': 'OPENAI',
    'GEMINI_API_KEY': 'GEMINI',
    'ANTHROPIC_API_KEY': 'ANTHROPIC',
    'MISTRAL_API_KEY': 'MISTRAL'
};

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isOwner } = useAuth();
    const [secrets, setSecrets] = useState<SystemSecret[]>([]);
    const [activeAIProvider, setActiveAIProviderState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load Secrets & Active Provider (ONLY if Owner)
    useEffect(() => {
        if (!isOwner || !user) {
            setSecrets([]);
            setActiveAIProviderState(null);
            setLoading(false);
            return;
        }

        fetchSystemConfig();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('system_config_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'system_config' },
                () => {
                    fetchSystemConfig();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [isOwner, user]);

    const fetchSystemConfig = async () => {
        setLoading(true);
        
        try {
            // 1. Fetch System Config (Global Settings)
            const { data: configData, error: configError } = await supabase
                .from('system_config')
                .select('*');

            if (configError) throw configError;

            // 2. Fetch API Keys (Secure Vault)
            const { data: apiKeysData, error: keysError } = await supabase
                .from('api_keys')
                .select('*');
            
            if (keysError) {
                console.warn("Could not fetch API keys (Check RLS):", keysError);
            }

            let loadedSecrets: SystemSecret[] = [];

            // Process System Config (Legacy encryption logic preserved for non-API secrets)
            if (configData) {
                const configSecrets = configData.map((item: any) => {
                    let decryptedValue = "";
                    try {
                        // Attempt decrypt legacy encrypted values
                        decryptedValue = AES.decrypt(item.key_value, ENCRYPTION_SECRET).toString(encUtf8);
                        if (!decryptedValue) decryptedValue = item.key_value;
                    } catch (e) {
                        decryptedValue = item.key_value;
                    }

                    return {
                        keyName: item.key_name,
                        keyValue: decryptedValue,
                        lastUpdatedBy: item.last_updated_by || 'system',
                        updatedAt: item.created_at || new Date().toISOString()
                    };
                });
                loadedSecrets = [...loadedSecrets, ...configSecrets];
            }

            // Process API Keys (Inject as secrets)
            if (apiKeysData) {
                const keySecrets = apiKeysData.map((key: any) => {
                    // Reverse map provider name to frontend key name if possible
                    const entry = Object.entries(PROVIDER_MAP).find(([k, v]) => v === key.provider);
                    const keyName = entry ? entry[0] : `${key.provider}_API_KEY`;
                    
                    return {
                        keyName: keyName,
                        keyValue: key.api_key, // API keys are stored plain/encrypted in DB, here we show as is
                        lastUpdatedBy: 'admin',
                        updatedAt: key.created_at
                    };
                });
                // Merge, prioritizing api_keys table over system_config if duplicate
                // But filter out old system_config keys if present
                loadedSecrets = loadedSecrets.filter(s => !keySecrets.find(k => k.keyName === s.keyName));
                loadedSecrets = [...loadedSecrets, ...keySecrets];
            }

            setSecrets(loadedSecrets);

            // Find active provider
            const activeProviderEntry = configData?.find((item: any) => item.key_name === 'active_ai_provider');
            // Ensure fallback to 'GROQ' if not set
            // The DB stores 'GROQ', but frontend expects 'GROQ_API_KEY' for compatibility
            let activeVal = activeProviderEntry?.key_value || 'GROQ';
            // If stored value is like 'GROQ', map to 'GROQ_API_KEY'
            const mappedActive = Object.keys(PROVIDER_MAP).find(k => PROVIDER_MAP[k] === activeVal);
            setActiveAIProviderState(mappedActive || activeVal);

        } catch (error) {
            console.error("Error loading system config:", error);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const logAudit = async (action: string, keyName: string) => {
        if (!user) return;
        
        await supabase.from('audit_logs').insert({
            action: `${action}: ${keyName}`,
            actor_id: user.uid,
            details: { 
                actorEmail: user.email,
                isOwner: true,
                details: "Tier 0 System Configuration Change"
            },
            timestamp: new Date().toISOString(),
        });
    };

    const addSecret = async (keyName: string, keyValue: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        
        // Check if this is a known Provider Key
        const providerName = PROVIDER_MAP[keyName];
        
        if (providerName) {
            // Insert into api_keys table
            // First destroy old keys for this provider to enforce single active key logic via our new UI
            // Actually, we can just insert a new one. The constraint handles uniqueness for ACTIVE keys.
            // But for cleanliness, let's upsert matching provider.
            
            // Note: The UI assumes one key per provider.
            // We will delete existing keys for this provider first to simplify "update" logic
            await (supabase.from('api_keys') as any).delete().eq('provider', providerName);
            
            const { error } = await (supabase.from('api_keys') as any).insert({
                provider: providerName,
                api_key: keyValue,
                is_active: false // Default to inactive, user must activate separately
            });
            
            if (error) throw error;
        } else {
            // Legacy system_config behavior
            const encryptedValue = AES.encrypt(keyValue, ENCRYPTION_SECRET).toString();
            const { error } = await supabase.from('system_config').insert({
                key_name: keyName,
                key_value: encryptedValue,
                last_updated_by: user.uid,
                updated_at: new Date().toISOString()
            });
             if (error) throw error;
        }

        await fetchSystemConfig(); // Reload state
        await logAudit("ADD_KEY", keyName);
    };

    const updateSecret = async (keyName: string, keyValue: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");

        const providerName = PROVIDER_MAP[keyName];

        if (providerName) {
            // For updates, we replace the key for the provider
            // Ideally we find the existing record, but for simplicity we can delete/insert or update by provider
            await (supabase.from('api_keys') as any).delete().eq('provider', providerName);
             const { error } = await (supabase.from('api_keys') as any).insert({
                provider: providerName,
                api_key: keyValue,
                is_active: false // Reset to inactive on update for safety, user must re-activate
            });
            if (error) throw error;
        } else {
            const encryptedValue = AES.encrypt(keyValue, ENCRYPTION_SECRET).toString();
            const { error } = await supabase.from('system_config').upsert({
                key_name: keyName,
                key_value: encryptedValue,
                last_updated_by: user.uid,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key_name'
            });
            if (error) throw error;
        }

        await fetchSystemConfig();
        await logAudit("UPDATE_KEY", keyName);
    };

    const deleteSecret = async (keyName: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        
        const providerName = PROVIDER_MAP[keyName];

        if (providerName) {
            const { error } = await (supabase
                .from('api_keys') as any)
                .delete()
                .eq('provider', providerName);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('system_config')
                .delete()
                .eq('key_name', keyName);
            if (error) throw error;
        }

        await fetchSystemConfig();
        await logAudit("DELETE_KEY", keyName);
    };

    const setActiveAIProvider = async (keyName: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        
        const providerName = PROVIDER_MAP[keyName] || keyName; // e.g. 'OPENAI'

        // 1. Update system_config to point to this provider
        const { error } = await supabase.from('system_config').upsert({
            key_name: 'active_ai_provider',
            key_value: providerName, // Store 'OPENAI' not 'OPENAI_API_KEY'
            last_updated_by: user.uid,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key_name'
        });

        if (error) throw error;

        // 2. Activate the key in api_keys table (if applicable)
        if (PROVIDER_MAP[keyName]) {
            // Deactivate all others first (handled by DB trigger or manual updates)
            // But we can just use the SQL function we created: activate_api_key
            // However, we need the UUID.
            // Let's do it manually for now:
            
            // Tur off all keys for this provider to be safe (though we want to turn ON)
            await (supabase.from('api_keys') as any).update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); 
            
            // We want ONE global active provider? 
            // The Edge Function reads 'active_ai_provider' from system_config -> 'OPENAI'
            // Then it looks for an ACTIVE key for 'OPENAI'.
            // So we just need to ensure the key for 'OPENAI' is active.
            
            await (supabase.from('api_keys') as any).update({ is_active: true }).eq('provider', providerName);
        }

        await fetchSystemConfig();
        await logAudit("SET_ACTIVE_PROVIDER", keyName);
    };

    const getSecret = (keyName: string) => {
        const secret = secrets.find(s => s.keyName === keyName);
        return secret ? secret.keyValue : null;
    };

    return (
        <SystemConfigContext.Provider value={{ 
            secrets, 
            activeAIProvider, 
            loading, 
            addSecret, 
            updateSecret, 
            deleteSecret, 
            getSecret,
            setActiveAIProvider 
        }}>
            {children}
        </SystemConfigContext.Provider>
    );
};

export const useSystemConfig = () => {
    const context = useContext(SystemConfigContext);
    if (context === undefined) {
        throw new Error('useSystemConfig must be used within a SystemConfigProvider');
    }
    return context;
};
