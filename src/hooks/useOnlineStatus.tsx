import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Connection restored', {
                description: 'You are back online',
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error('No internet connection', {
                description: 'Some features may not work properly',
                duration: Infinity,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};
