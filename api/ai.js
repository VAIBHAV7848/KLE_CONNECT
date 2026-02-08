import Internal API from 'openai';
import admin from 'firebase-admin';
import CryptoJS from 'crypto-js';

const { AES, enc } = CryptoJS;
const encUtf8 = enc.Utf8;

// Secret Encryption Key (Must match SystemConfigContext.tsx)
const ENCRYPTION_SECRET = "TIER_0_GOD_MODE_SECRET";

// Fallback Config (Must match firebase.ts)
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "kleconnect-a7c43";
const FIREBASE_DATABASE_URL = process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || "https://kleconnect-a7c43-default-rtdb.firebaseio.com";
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    try {
        const config = {
            projectId: FIREBASE_PROJECT_ID,
            databaseURL: FIREBASE_DATABASE_URL
        };

        if (PRIVATE_KEY && CLIENT_EMAIL) {
            config.credential = admin.credential.cert({
                projectId: FIREBASE_PROJECT_ID,
                clientEmail: CLIENT_EMAIL,
                privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
            console.info(`[System] Firebase Admin Initialized with Service Account | Project: ${FIREBASE_PROJECT_ID}`);
        } else {
            console.warn(`[System] Firebase Admin Initialized with NO Service Account. Database access may fail. | Project: ${FIREBASE_PROJECT_ID}`);
        }

        admin.initializeApp(config);
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
            console.warn(`[SECURITY_MONITOR] AI_ACCESS_DENIED | Reason: ${authError.message}`);
            return res.status(403).json({ 
                error: "Forbidden", 
                reply: `⚠️ **Security Error**: ${authError.message}. Please re-login.` 
            });
        }
        // --- END SECURITY ---

        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // --- DYNAMIC CONFIG WITH AGGRESSIVE RACING ---
        let apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
        let activeProvider = "GROQ_API_KEY";

        try {
            console.log("[System] Racing for configuration (4s limit)...");
            const dbFetch = admin.database().ref('system_config').once('value');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Config Timeout')), 4000));
            
            const snapshot = await Promise.race([dbFetch, timeout]);

            if (snapshot.exists()) {
                const config = snapshot.val();
                activeProvider = config.active_ai_provider || "GROQ_API_KEY";
                const keyData = config.api_keys?.[activeProvider];
                
                if (keyData && keyData.keyValue) {
                    try {
                        const bytes = AES.decrypt(keyData.keyValue, ENCRYPTION_SECRET);
                        const decrypted = bytes.toString(encUtf8);
                        if (decrypted) {
                            apiKey = decrypted;
                            console.log(`[System] Configuration acquired: ${activeProvider}`);
                        }
                    } catch (e) { console.error("[System] Decrypt Fail"); }
                }
            }
        } catch (err) {
            console.warn(`[System] Config Race lost (${err.message}). Using ENV Fallback.`);
            // If race lost, we keep the default ENV apiKey and GROQ provider
        }

        if (!apiKey) {
            return res.status(503).json({
                error: "Configuration Error",
                reply: "⚠️ **System Error**: No API credentials found. Please check your .env or System Config."
            });
        }

        // --- Provider Configuration ---
        let baseURL = "https://api.groq.com/openai/v1";
        let model = "llama-3.3-70b-versatile";

        if (activeProvider === "OPENAI_API_KEY") {
            baseURL = "https://api.openai.com/v1";
            model = "gpt-4-turbo-preview"; 
        } else if (activeProvider === "GEMINI_API_KEY") {
            baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
            model = "gemini-1.5-flash"; // Ultra fast to stay under 10s
        }

        const client = new Internal API({
            apiKey: apiKey,
            baseURL: baseURL
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
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });

        // --- COST MONITORING ---
        console.info(`[COST_MONITOR] AI_COMPLETION | Provider: ${activeProvider} | Tokens: ${completion.usage?.total_tokens || 'unknown'} | Model: ${completion.model}`);

        return res.status(200).json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error("Vercel AI Error:", error);
        return res.status(500).json({ error: "AI processing failed", details: error.message });
    }
}
