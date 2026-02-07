/**
 * Security Notification Utility
 * Supports Discord Webhooks and Telegram Bots
 */
export async function notifySecurity(event, details) {
    const WEBHOOK_URL = process.env.SECURITY_WEBHOOK_URL;
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const isFailure = event.includes('FAILURE');
    const statusEmoji = isFailure ? '🚨' : '✅';

    // 1. DISCORD LOGIC
    if (WEBHOOK_URL) {
        try {
            const payload = {
                content: `${statusEmoji} **KLE CONNECT Security Alert**`,
                embeds: [{
                    title: event,
                    description: `Security event detected at ${timestamp}`,
                    color: isFailure ? 15548997 : 3066993,
                    fields: Object.entries(details).map(([key, value]) => ({
                        name: key,
                        value: String(value),
                        inline: true
                    })),
                    footer: { text: "KLE Platform Sentinel" }
                }]
            };
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.error("[Monitor] Discord fail", e.message); }
    }

    // 2. TELEGRAM LOGIC
    if (TG_TOKEN && TG_CHAT_ID) {
        try {
            const text = `${statusEmoji} *KLE CONNECT SECURITY ALERT*\n\n` +
                         `*Event:* ${event.replace(/_/g, '\\_')}\n` +
                         `*Time:* ${timestamp}\n\n` +
                         Object.entries(details)
                            .map(([key, val]) => `• *${key}:* \`${val}\``)
                            .join('\n');

            const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
            await fetch(tgUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TG_CHAT_ID,
                    text: text,
                    parse_mode: 'MarkdownV2'
                })
            });
            console.info(`[SECURITY_NOTIFY_SENT] Telegram alert sent for: ${event}`);
        } catch (e) { console.error("[Monitor] Telegram fail", e.message); }
    }

    if (!WEBHOOK_URL && (!TG_TOKEN || !TG_CHAT_ID)) {
        console.warn(`[SECURITY_NOTIFY_SKIP] No notification provider configured for: ${event}`);
    }
}
