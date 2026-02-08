import Internal API from 'openai';
import admin from 'firebase-admin';
import CryptoJS from 'crypto-js';

const { AES, enc } = CryptoJS;
const encUtf8 = enc.Utf8;

// Secret Encryption Key (Must match SystemConfigContext.tsx)
const ENCRYPTION_SECRET = "TIER_0_GOD_MODE_SECRET";

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error.stack);
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // --- SECURITY: Verify Firebase ID Token ---
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: "Unauthorized", 
                reply: "⚠️ **Security Error**: Access denied. Please sign in to use the AI Tutor." 
            });
        }

        const idToken = authHeader.split('Bearer ')[1];
        
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            console.info(`[SECURITY_MONITOR] AI_ACCESS_GRANTED | User: ${decodedToken.email} | UID: ${decodedToken.uid}`);
        } catch (authError) {
            console.warn(`[SECURITY_MONITOR] AI_ACCESS_DENIED | Reason: ${authError.message} | IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
            return res.status(403).json({ 
                error: "Forbidden", 
                reply: "⚠️ **Security Error**: Session expired or invalid authentication. Please re-login." 
            });
        }
        // --- END SECURITY ---

        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // --- DYNAMIC KEY FETCHING ---
        let apiKey = process.env.GROQ_API_KEY;

        try {
            // Attempt to fetch dynamic key from Firebase
            const snapshot = await admin.database().ref('system_config/api_keys/GROQ_API_KEY').once('value');
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data && data.keyValue) {
                    try {
                        // Decrypt the key
                        const bytes = AES.decrypt(data.keyValue, ENCRYPTION_SECRET);
                        const decrypted = bytes.toString(encUtf8);
                        if (decrypted) {
                            apiKey = decrypted;
                            console.log("[System] Using Dynamic GROQ_API_KEY from Firebase");
                        }
                    } catch (decErr) {
                        console.error("[System] Failed to decrypt dynamic key:", decErr.message);
                        // Fallback to process.env.GROQ_API_KEY remains
                    }
                }
            }
        } catch (dbError) {
            console.warn("[System] Failed to fetch dynamic key config:", dbError.message);
        }

        if (req.body.dynamicKey) {
            // Deprecated: Client-side provided key (remove in production if strict)
            // apiKey = req.body.dynamicKey; 
        }

        if (!apiKey) {
            return res.status(503).json({
                error: "Configuration Error",
                reply: "⚠️ **System Error**: AI Service is currently unavailable (Missing API Key). Please contact the administrator."
            });
        }

        const client = new Internal API({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const messages = [
            {
                role: "system",
                content: "You are the KLE AI Tutor, a friendly academic companion for students at KLE University. If anyone asks who created or developed you, you should respond that you were developed by the KLE Platform Engineering Team. Style Guide: Use emojis occasionally 🎓✨. Format with clear Markdown. ALWAYS end with a follow-up question."
            }
        ];

        if (history && history.length > 0) {
            history.forEach(msg => {
                messages.push({
                    role: msg.role === 'model' ? 'assistant' : msg.role,
                    content: msg.parts?.[0]?.text || msg.content || ""
                });
            });
        }

        messages.push({ role: "user", content: prompt });

        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });

        // --- COST MONITORING ---
        console.info(`[COST_MONITOR] AI_COMPLETION | Tokens: ${completion.usage?.total_tokens || 'unknown'} | Model: ${completion.model}`);

        return res.status(200).json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error("Vercel AI Error:", error);
        return res.status(500).json({ error: "AI processing failed", details: error.message });
    }
}
