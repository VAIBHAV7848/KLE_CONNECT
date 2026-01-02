import Internal API from 'openai';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Firebase config (same as frontend)
const firebaseConfig = {
    apiKey: "<GOOGLE_KEY_HIDDEN>",
    authDomain: "kle-connect.firebaseapp.com",
    databaseURL: "https://kle-connect-default-rtdb.firebaseio.com",
    projectId: "kle-connect",
    storageBucket: "kle-connect.firebasestorage.app",
    messagingSenderId: "1029633402663",
    appId: "1:1029633402663:web:c4d8e2a0e5a5f5a5f5a5f5"
};

// Initialize Firebase (singleton)
let firebaseApp;
let database;
try {
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
} catch (error) {
    console.warn('Firebase initialization failed:', error.message);
}

// Helper: Fetch API key from Firebase System Config
async function getApiKeyFromFirebase(keyName) {
    if (!database) return null;
    try {
        const keyRef = ref(database, `system_config/api_keys/${keyName}`);
        const snapshot = await get(keyRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Decrypt if needed (for now, assume stored encrypted with AES)
            // You'll need to add crypto-js here if you want to decrypt
            return data.keyValue; // Return encrypted value for now
        }
    } catch (error) {
        console.error(`Failed to fetch ${keyName} from Firebase:`, error);
    }
    return null;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // PRIORITY: Firebase System Config -> Dynamic Key (Owner Testing) -> Env Var (Fallback)
        let apiKey = await getApiKeyFromFirebase('GROQ_API_KEY');

        if (!apiKey) {
            // Fallback to dynamic key from request body (owner testing)
            if (req.body.dynamicKey) {
                apiKey = req.body.dynamicKey;
                console.log("Using Runtime Dynamic Key for AI Request");
            } else {
                // Final fallback to environment variable
                apiKey = process.env.GROQ_API_KEY;
                console.log("Using Environment Variable for GROQ_API_KEY");
            }
        } else {
            console.log("Using Firebase System Config for GROQ_API_KEY");
        }

        if (!apiKey) {
            console.error("GROQ_API_KEY not found in Firebase, request body, or environment variables");
            return res.status(500).json({
                error: "Configuration Error",
                reply: "⚠️ **System Error**: GROQ_API_KEY not configured. Please add it in System Configuration or Vercel environment variables."
            });
        }

        const client = new Internal API({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const messages = [
            {
                role: "system",
                content: "You are the KLE AI Tutor, a friendly academic companion for students at KLE University. Style Guide: Use emojis occasionally 🎓✨. Format with clear Markdown. ALWAYS end with a follow-up question."
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

        return res.status(200).json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error("Vercel AI Error:", error);
        return res.status(500).json({ error: "AI processing failed", details: error.message });
    }
}
