// Environment variable validation
const requiredEnvVars = {
    VITE_AGORA_APP_ID: import.meta.env.VITE_AGORA_APP_ID,
    VITE_TOKEN_SERVER_URL: import.meta.env.VITE_TOKEN_SERVER_URL,
};

// Validate on app startup
export const validateEnv = () => {
    const missing: string[] = [];

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        if (!value) {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        console.warn('⚠️ Optional environment variables not set:', missing);
        console.warn('Some features (Video Calls, AI Tutor) may not work without these.');
        console.warn('See .env.example for configuration instructions.');
    }

    return missing.length === 0;
};

// Export validated config
export const config = {
    agoraAppId: requiredEnvVars.VITE_AGORA_APP_ID || '',
    tokenServerUrl: requiredEnvVars.VITE_TOKEN_SERVER_URL || '',
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
};
