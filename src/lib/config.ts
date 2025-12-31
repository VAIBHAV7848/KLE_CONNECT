// Environment variable validation
const requiredEnvVars = {
    VITE_AGORA_APP_ID: import.meta.env.VITE_AGORA_APP_ID,
    VITE_TOKEN_SERVER_URL: import.meta.env.VITE_TOKEN_SERVER_URL,
    VITE_AI_API_URL: import.meta.env.VITE_AI_API_URL,
};

// Validate on app startup
export const validateEnv = () => {
    const missing: string[] = [];

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        if (!value) {
            missing.push(key);
        }
    });

    if (missing.length > 0 && import.meta.env.MODE === 'production') {
        console.error('❌ Missing required environment variables:', missing);
        console.error('Please check your .env file');
    }

    return missing.length === 0;
};

// Export validated config
export const config = {
    agoraAppId: requiredEnvVars.VITE_AGORA_APP_ID || '',
    tokenServerUrl: requiredEnvVars.VITE_TOKEN_SERVER_URL || '',
    aiApiUrl: requiredEnvVars.VITE_AI_API_URL || '',
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
};
