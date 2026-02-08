import Internal API from 'openai';
import admin from 'firebase-admin';
import CryptoJS from 'crypto-js';

const { AES, enc } = CryptoJS;
const encUtf8 = enc.Utf8;
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        // --- DYNAMIC CONFIG WITH FAST-LANE ROUTING ---
        let apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
        let activeProvider = "GROQ_API_KEY";
        let routeStatus = "FALLBACK (ENV_GROQ)";

        // Prioritize Internal API as a safer fallback
        if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
            apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
            activeProvider = "OPENAI_API_KEY";
            routeStatus = "FALLBACK (ENV_OPENAI)";
        } else if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) { // Keep Analytics Engine as a secondary fallback if Internal API isn't present
            apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
            activeProvider = "GEMINI_API_KEY";
            routeStatus = "FALLBACK (ENV_GEMINI)";
        }

        try {
            console.log("[System] Config Race (2.5s lane)...");
            const dbFetch = admin.database().ref('system_config').once('value');
            // Reducing to 2.5s to leave 7s for the AI to speak
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500));
            
            const snapshot = await Promise.race([dbFetch, timeout]);

            if (snapshot.exists()) {
                const config = snapshot.val();
                const selected = config.active_ai_provider;
                
                if (selected) {
                    const keyData = config.api_keys?.[selected];
                    if (keyData && keyData.keyValue) {
                        try {
                            const bytes = AES.decrypt(keyData.keyValue, ENCRYPTION_SECRET);
                            const decrypted = bytes.toString(encUtf8);
                            if (decrypted) {
                                // SECURITY: Check if this is the known leaked key IUfE
                                if (decrypted.endsWith("IUfE")) {
                                    console.warn("[SECURITY] Blocked use of LEAKED key IUfE. Falling back to ENV keys.");
                                    routeStatus = "BLOCKED (LEAKED_KEY_DETECTED)";
                                    // Do not update apiKey or activeProvider, continue with ENV fallback
                                } else {
                                    apiKey = decrypted;
                                    activeProvider = selected;
                                    routeStatus = "LIVE (SYNC)";
                                    console.log(`[System] Data-Sync Success: ${activeProvider}`);
                                }
                            }
                        } catch (e) { 
                            console.error("[System] Decrypt Fail"); 
                            routeStatus = "ERROR (DECRYPT)";
                        }
                    }
                }
            }
        } catch (err) {
            console.warn(`[System] DB Slow (${err.message}). Using Fast-Lane: ${activeProvider}`);
        }

        if (!apiKey) {
            return res.status(503).json({
                error: "Configuration Error",
                reply: "⚠️ **System Error**: No API credentials found. Please check your .env or System Config."
            });
        }

        const keySuffix = String(apiKey).slice(-4);
        
        // Final Security Check: Never allow the leaked key to hit the execution phase
        if (keySuffix === "IUfE") {
            return res.status(403).json({
                error: "Security Check Failed",
                reply: `⚠️ **Security Alert**: The key ending in ***IUfE is LEAKED and BLOCKED. Please delete it from Vercel/Admin and use your NEW key.`
            });
        }

        console.log(`[AI_ROUTING] Executing: ${activeProvider} | Key: ***${keySuffix}`);

        // --- AI EXECUTION ---
        try {
            if (activeProvider.includes("GEMINI")) {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1' });
                
                const chatHistory = (history || []).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: String(m.content || m.parts?.[0]?.text || "") }]
                }));

                const chat = model.startChat({
                    history: chatHistory,
                    generationConfig: { maxOutputTokens: 1000 }
                });

                const result = await chat.sendMessage(prompt);
                const response = await result.response;
                
                return res.status(200).json({ 
                    reply: response.text(),
                    provider: "GEMINI",
                    routeStatus: routeStatus
                });
            } else {
                let baseURL = "https://api.groq.com/openai/v1";
                let modelName = "llama-3.3-70b-versatile";

                if (activeProvider.includes("OPENAI")) {
                    baseURL = "https://api.openai.com/v1";
                    modelName = "gpt-4o-mini";
                }

                const client = new Internal API({
                    apiKey: apiKey,
                    baseURL: baseURL,
                    timeout: 8000
                });

                const messages = [
                    {
                        role: "system",
                        content: "You are the KLE AI Tutor, a friendly academic companion for students at KLE University. Style Guide: Use emojis occasionally 🎓✨. ALWAYS end with a follow-up question."
                    }
                ];

                (history || []).forEach(msg => {
                    messages.push({
                        role: msg.role === 'model' ? 'assistant' : msg.role,
                        content: msg.content || msg.parts?.[0]?.text || ""
                    });
                });

                messages.push({ role: "user", content: prompt });

                const completion = await client.chat.completions.create({
                    model: modelName,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                });

                return res.status(200).json({ 
                    reply: completion.choices[0].message.content,
                    provider: activeProvider.replace('_API_KEY', ''),
                    routeStatus: routeStatus
                });
            }
        } catch (execError) {
            console.error("[System] AI Execution Failed:", execError.message);
            const errorMsg = execError.response?.data?.error?.message || execError.message || "Unknown AI Error";
            return res.status(500).json({ 
                error: "AI processing failed", 
                details: errorMsg,
                reply: `⚠️ **AI Service Error**: ${errorMsg} (Key: ***${keySuffix}). Please check if your key matches the one in Admin.`
            });
        }
    } catch (error) {
        console.error("Global AI Handler Error:", error);
        return res.status(500).json({ error: "System error", details: error.message });
    }
}
