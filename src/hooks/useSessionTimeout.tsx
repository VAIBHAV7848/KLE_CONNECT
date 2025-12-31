import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export const useSessionTimeout = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout>();
    const lastActivityRef = useRef(Date.now());

    const resetTimeout = () => {
        lastActivityRef.current = Date.now();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            toast.error('Session expired due to inactivity');
            signOut();
            navigate('/auth');
        }, TIMEOUT_DURATION);
    };

    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, resetTimeout);
        });

        resetTimeout();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimeout);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [user]);
};
