import React, { createContext, useContext, useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, remove, push } from 'firebase/database';
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
    updatedAt: number;
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

        const configRef = ref(database, 'system_config');
        const unsubscribe = onValue(configRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // 1. Load Keys
                if (data.api_keys) {
                    const loadedSecrets: SystemSecret[] = Object.entries(data.api_keys).map(([key, val]: [string, any]) => {
                        let decryptedValue = "";
                        try {
                            decryptedValue = AES.decrypt(val.keyValue, ENCRYPTION_SECRET).toString(encUtf8);
                            if (!decryptedValue) decryptedValue = val.keyValue;
                        } catch (e) {
                            decryptedValue = val.keyValue;
                        }

                        return {
                            keyName: key,
                            keyValue: decryptedValue,
                            lastUpdatedBy: val.lastUpdatedBy,
                            updatedAt: val.updatedAt
                        };
                    });
                    setSecrets(loadedSecrets);
                } else {
                    setSecrets([]);
                }

                // 2. Load Active Provider
                setActiveAIProviderState(data.active_ai_provider || 'GROQ_API_KEY');
            } else {
                setSecrets([]);
                setActiveAIProviderState('GROQ_API_KEY');
            }
            setLoading(false);
        }, (error) => {
            console.error("Access Denied to System Config:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOwner, user]);

    // Actions
    const logAudit = async (action: string, keyName: string) => {
        if (!user) return;
        const logRef = ref(database, `system/audit_logs`);
        await push(logRef, {
            actorUserId: user.uid,
            actorEmail: user.email,
            isOwner: true,
            action,
            keyName,
            timestamp: Date.now(),
            details: "Tier 0 System Configuration Change"
        });
    };

    const addSecret = async (keyName: string, keyValue: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        const encryptedValue = AES.encrypt(keyValue, ENCRYPTION_SECRET).toString();
        await set(ref(database, `system_config/api_keys/${keyName}`), {
            keyValue: encryptedValue,
            lastUpdatedBy: user.uid,
            updatedAt: Date.now()
        });
        await logAudit("ADD_KEY", keyName);
    };

    const updateSecret = async (keyName: string, keyValue: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        const encryptedValue = AES.encrypt(keyValue, ENCRYPTION_SECRET).toString();
        await set(ref(database, `system_config/api_keys/${keyName}`), {
            keyValue: encryptedValue,
            lastUpdatedBy: user.uid,
            updatedAt: Date.now()
        });
        await logAudit("UPDATE_KEY", keyName);
    };

    const deleteSecret = async (keyName: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        await remove(ref(database, `system_config/api_keys/${keyName}`));
        await logAudit("DELETE_KEY", keyName);
    };

    const setActiveAIProvider = async (keyName: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");
        await set(ref(database, `system_config/active_ai_provider`), keyName);
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
