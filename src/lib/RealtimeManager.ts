import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

type SubscriptionCallback<T> = (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T;
    old: T;
}) => void;

interface Subscription {
    table: string;
    filter: string | undefined;
    callback: SubscriptionCallback<any>;
}

class RealtimeManager {
    private static instance: RealtimeManager;
    private activeSubscriptions: Map<string, Subscription> = new Map();
    private channels: Map<string, RealtimeChannel> = new Map();
    private isReconnecting: boolean = false;

    private constructor() {
        this.setupHealthCheck();
    }

    public static getInstance(): RealtimeManager {
        if (!RealtimeManager.instance) {
            RealtimeManager.instance = new RealtimeManager();
        }
        return RealtimeManager.instance;
    }

    private setupHealthCheck() {
        supabase.channel('system_health')
            .subscribe((status) => {
                if (status === 'CLOSED' && !this.isReconnecting) {
                    this.reconnectAll();
                }
            });
    }

    private async reconnectAll() {
        this.isReconnecting = true;
        console.warn(`[RealtimeManager] Connection closed. Attempting to resubscribe ${this.activeSubscriptions.size} channels...`);

        // Clear existing channels
        this.channels.forEach(ch => ch.unsubscribe());
        this.channels.clear();

        // Re-establish all subscriptions
        for (const [id, sub] of Array.from(this.activeSubscriptions.entries())) {
            this.createChannel(id, sub);
        }

        this.isReconnecting = false;
        window.dispatchEvent(new CustomEvent('supabase-realtime-reconnected'));
    }

    private createChannel(id: string, sub: Subscription) {
        const channel = supabase
            .channel(id)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: sub.table,
                    filter: sub.filter,
                },
                (payload) => sub.callback(payload as any)
            )
            .subscribe();

        this.channels.set(id, channel);
    }

    public subscribe<T>(
        table: string,
        filter: string | undefined,
        callback: SubscriptionCallback<T>
    ): () => void {
        const subscriptionId = `${table}:${filter || 'all'}:${Math.random().toString(36).substring(7)}`;
        const subscription: Subscription = { table, filter, callback };

        this.activeSubscriptions.set(subscriptionId, subscription);
        this.createChannel(subscriptionId, subscription);

        return () => {
            const channel = this.channels.get(subscriptionId);
            if (channel) channel.unsubscribe();
            this.channels.delete(subscriptionId);
            this.activeSubscriptions.delete(subscriptionId);
        };
    }
}

export const realtimeManager = RealtimeManager.getInstance();

