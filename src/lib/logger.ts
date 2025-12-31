/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Development-only logging utility
 * Prevents console statements in production builds
 */

const isDev = import.meta.env.MODE === 'development';

export const logger = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args);
    },

    error: (...args: any[]) => {
        if (isDev) console.error(...args);
    },

    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },

    info: (...args: any[]) => {
        if (isDev) console.info(...args);
    },

    debug: (...args: any[]) => {
        if (isDev) console.debug(...args);
    },
};

// Production-safe error logging
export const logError = (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (isDev) {
        console.error(`[${context || 'Error'}]:`, errorMessage);
        if (errorStack) console.error(errorStack);
    } else {
        // In production, you could send to error tracking service
        // e.g., Sentry, LogRocket, etc.
    }
};
