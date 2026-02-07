/**
 * Admin Authentication Proxy
 * Moves master password verification to server-side
 */
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { email, password } = req.body;
        const MASTER_PASSWORD = process.env.MASTER_ADMIN_PASSWORD;
        const OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL;
        const SECONDARY_EMAIL = process.env.SECONDARY_ADMIN_EMAIL;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const isAdmin = [OWNER_EMAIL, SECONDARY_EMAIL].includes(normalizedEmail);

        if (isAdmin && password === MASTER_PASSWORD) {
            console.info(`[SECURITY_MONITOR] ADMIN_AUTH_SUCCESS | User: ${normalizedEmail}`);
            return res.status(200).json({
                success: true,
                adminUser: {
                    email: normalizedEmail,
                    displayName: normalizedEmail === OWNER_EMAIL ? 'Platform Owner' : 'Platform Administrator',
                    uid: 'admin-bypass-' + Buffer.from(normalizedEmail).toString('base64').substring(0, 10),
                    emailVerified: true
                }
            });
        }

        console.warn(`[SECURITY_MONITOR] ADMIN_AUTH_FAILURE | User: ${normalizedEmail} | IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
        return res.status(401).json({ success: false, error: "Invalid credentials" });
    } catch (error) {
        return res.status(500).json({ error: "Server error" });
    }
}
