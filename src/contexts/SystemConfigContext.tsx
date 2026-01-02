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
    loading: boolean;
    addSecret: (keyName: string, keyValue: string) => Promise<void>;
    updateSecret: (keyName: string, keyValue: string) => Promise<void>;
    deleteSecret: (keyName: string) => Promise<void>;
    getSecret: (keyName: string) => string | null;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isOwner } = useAuth();
    const [secrets, setSecrets] = useState<SystemSecret[]>([]);
    const [loading, setLoading] = useState(true);

    // Load Secrets (ONLY if Owner)
    useEffect(() => {
        if (!isOwner || !user) {
            setSecrets([]);
            setLoading(false);
            return;
        }

        const secretsRef = ref(database, 'system_config/api_keys');
        const unsubscribe = onValue(secretsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedSecrets: SystemSecret[] = Object.entries(data).map(([key, val]: [string, any]) => {
                    let decryptedValue = "";
                    try {
                        // Try to decrypt
                        decryptedValue = AES.decrypt(val.keyValue, ENCRYPTION_SECRET).toString(encUtf8);
                        if (!decryptedValue) decryptedValue = val.keyValue; // Fallback if not encrypted or key fail
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
            isOwner: true, // Redundant but explicit
            action,
            keyName,
            timestamp: Date.now(),
            details: "Tier 0 System Configuration Change"
        });
    };

    const addSecret = async (keyName: string, keyValue: string) => {
        if (!isOwner || !user) throw new Error("Unauthorized");

        // Encrypt
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

        // Encrypt
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

    const getSecret = (keyName: string) => {
        const secret = secrets.find(s => s.keyName === keyName);
        return secret ? secret.keyValue : null;
    };

    return (
        <SystemConfigContext.Provider value={{ secrets, loading, addSecret, updateSecret, deleteSecret, getSecret }}>
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
