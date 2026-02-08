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

        // --- MESH-DRIVEN ROUTING ---
        let apiKey = null;
        let activeProvider = null;
        let routeStatus = "INITIALIZING";

        try {
            console.log("[System] Synchronizing with Key Mesh (1.5s lane)...");
            const dbFetch = admin.database().ref('system_config').once('value');
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('MESH_TIMEOUT')), 1500));
            
            const snapshot = await Promise.race([dbFetch, timeout]);

            if (snapshot.exists()) {
                const config = snapshot.val();
                activeProvider = config.active_ai_provider;
                
                if (activeProvider) {
                    const keyData = config.api_keys?.[activeProvider];
                    if (keyData && keyData.keyValue) {
                        try {
                            const bytes = AES.decrypt(keyData.keyValue, ENCRYPTION_SECRET);
                            const decrypted = bytes.toString(encUtf8);
                            if (decrypted) {
                                // SECURITY: Block leaked key IUfE
                                if (decrypted.endsWith("IUfE")) {
                                    console.warn("[SECURITY] Blocked leaked key in Mesh.");
                                    throw new Error("LEAKED_KEY_DETECTED");
                                }
                                apiKey = decrypted;
                                routeStatus = "MESH (SYNCED)";
                                console.log(`[System] Mesh Node Active: ${activeProvider}`);
                            }
                        } catch (e) { 
                            console.error("[System] Mesh Decrypt Fail");
                            throw new Error("DECRYPT_FAILURE");
                        }
                    } else {
                        throw new Error(`MISSING_KEY_FOR_${activeProvider}`);
                    }
                }
            } else {
                console.warn("[System] Mesh Empty. Falling back to Environment.");
                routeStatus = "MESH (EMPTY)";
            }
        } catch (err) {
            console.warn(`[System] Mesh Sync Error: ${err.message}`);
            routeStatus = `ERROR (${err.message})`;
        }

        // --- EMERGENCY FALLBACK (Only if Mesh fails or is empty) ---
        if (!apiKey) {
            console.log("[System] Mesh Unavailable. Checking Emergency Backups...");
            
            const envInternal API = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
            const envGroq = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
            const envAnalytics Engine = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

            // Prioritize Groq for fallback as it's usually free/active
            if (envGroq) {
                apiKey = envGroq;
                activeProvider = "GROQ_API_KEY";
                routeStatus = "FALLBACK (ENV_GROQ)";
            } else if (envInternal API && !envInternal API.endsWith("IUfE")) {
                apiKey = envInternal API;
                activeProvider = "OPENAI_API_KEY";
                routeStatus = "FALLBACK (ENV_OPENAI)";
            } else if (envAnalytics Engine && !envAnalytics Engine.endsWith("IUfE")) {
                apiKey = envAnalytics Engine;
                activeProvider = "GEMINI_API_KEY";
                routeStatus = "FALLBACK (ENV_GEMINI)";
            }
        }

        if (!apiKey) {
            return res.status(503).json({
                error: "System Hub Offline",
                reply: "⚠️ **System Error**: The Key Mesh is unreachable and no secondary nodes are present. Please check Firebase and Vercel ENV."
            });
        }

        const keySuffix = String(apiKey).slice(-4);
        console.log(`[AI_ROUTING] Executing via: ${activeProvider} | Node: ***${keySuffix} | Status: ${routeStatus}`);

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
                let modelName = "llama-3.1-8b-instant"; // Ultra-fast inference
                let temperature = 0.1;
                let maxTokens = 120;
                let systemPrompt = "You are a fast-response tutoring engine. Rules: Answer in fewest tokens. No explanations unless asked. No reasoning. No markdown. No emojis. If uncertain, say: 'Insufficient data.' Max output: 120 tokens.";

                if (activeProvider.includes("OPENAI")) {
                    baseURL = "https://api.openai.com/v1";
                    modelName = "gpt-4o-mini";
                    temperature = 0.7;
                    maxTokens = 1000;
                    systemPrompt = "You are the KLE AI Tutor, a friendly academic companion for students at KLE University. Style Guide: Use emojis occasionally 🎓✨. ALWAYS end with a follow-up question.";
                }

                const client = new Internal API({
                    apiKey: apiKey,
                    baseURL: baseURL,
                    timeout: 8000
                });

                const messages = [{ role: "system", content: systemPrompt }];

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
                    temperature: temperature,
                    max_tokens: maxTokens
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
                reply: `⚠️ **AI Service Error**: ${errorMsg}\n\n**Debug Info:**\n- Node: ***${keySuffix}\n- Provider: ${activeProvider}\n- Route: ${routeStatus}`
            });
        }
    } catch (error) {
        console.error("Global AI Handler Error:", error);
        return res.status(500).json({ error: "System error", details: error.message });
    }
}
