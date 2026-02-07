/**
 * Security Notification Utility
 * Sends alerts to a configured webhook (e.g., Discord, Slack)
 */
export async function notifySecurity(event, details) {
    const WEBHOOK_URL = process.env.SECURITY_WEBHOOK_URL;
    
    if (!WEBHOOK_URL) {
        console.info(`[SECURITY_NOTIFY_SKIP] No webhook configured for event: ${event}`);
        return;
    }

    try {
        const payload = {
            content: `🚨 **KLE CONNECT Security Alert** 🚨`,
            embeds: [{
                title: event,
                description: `A security-sensitive event occurred at ${new Date().toISOString()}`,
                color: event.includes('FAILURE') ? 15548997 : 3066993, // Red for failure, Green for success
                fields: Object.entries(details).map(([key, value]) => ({
                    name: key,
                    value: String(value),
                    inline: true
                })),
                footer: { text: "Platform Security Monitoring" }
            }]
        };

        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        console.info(`[SECURITY_NOTIFY_SENT] Alert sent for: ${event}`);
    } catch (error) {
        console.error(`[SECURITY_NOTIFY_ERROR] Failed to send alert:`, error.message);
    }
}
