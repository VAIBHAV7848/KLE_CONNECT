import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

// Firebase config
const firebaseConfig = {
    apiKey: "<GOOGLE_KEY_HIDDEN>",
    authDomain: "kle-connect.firebaseapp.com",
    databaseURL: "https://kle-connect-default-rtdb.firebaseio.com",
    projectId: "kle-connect",
    storageBucket: "kle-connect.firebasestorage.app",
    messagingSenderId: "1029633402663",
    appId: "1:1029633402663:web:c4d8e2a0e5a5f5a5f5a5f5"
};

// Initialize Firebase
let firebaseApp;
let database;
try {
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
} catch (error) {
    console.warn('Firebase initialization failed:', error.message);
}

// Helper: Fetch API key from Firebase
async function getApiKeyFromFirebase(keyName) {
    if (!database) return null;
    try {
        const keyRef = ref(database, `system_config/api_keys/${keyName}`);
        const snapshot = await get(keyRef);
        if (snapshot.exists()) {
            return snapshot.val().keyValue;
        }
    } catch (error) {
        console.error(`Failed to fetch ${keyName} from Firebase:`, error);
    }
    return null;
}

export default async function handler(req, res) {
    // 1. Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // PRIORITY: Firebase System Config -> Env Var (Fallback)
        let apiKey = await getApiKeyFromFirebase('GEMINI_API_KEY');

        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY;
            console.log("Using Environment Variable for GEMINI_API_KEY");
        } else {
            console.log("Using Firebase System Config for GEMINI_API_KEY");
        }

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY not configured. Please add it in System Configuration or environment variables."
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are the KLE AI Tutor, a friendly and enthusiastic academic companion for students. Style Guide: Use emojis occasionally 🎓✨. Format with clear Markdown. ALWAYS end with a follow-up question."
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error("Analytics Engine Vercel Error:", error);
        return res.status(500).json({ error: "AI processing failed", details: error.message });
    }
}
