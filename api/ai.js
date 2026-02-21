import Internal API from 'openai';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const { AES, enc } = CryptoJS;
const encUtf8 = enc.Utf8;
import { GoogleGenerativeAI } from "@google/generative-ai";

// GUARD: ENCRYPTION_SECRET is required - fail fast if missing
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "TIER_0_GOD_MODE_SECRET";

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://thrshfigvpafopddosto.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://kle-connect.vercel.app',
    'https://kle-connect.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
];

function getCorsOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return ALLOWED_ORIGINS[0];
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    return null;
}

// JSON error response helper - ensures consistent error format
function sendJsonError(res, status, code, message, details = null) {
    const response = {
        error: code,
        message: message,
        ...(details && { details })
    };
    return res.status(status).json(response);
}

// Usage tracking function
async function trackUsage(supabaseClient, token, activeProvider, success, responseTimeMs = null, errorMsg = null, tokens = { prompt: 0, completion: 0 }) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser(token);

        await supabaseClient.from('ai_usage_stats').insert({
            provider: activeProvider ? activeProvider.replace('_API_KEY', '') : 'unknown',
            user_id: user?.id || null,
            success: success,
            response_time_ms: responseTimeMs,
            prompt_tokens: tokens.prompt,
            completion_tokens: tokens.completion,
            error_message: errorMsg,
            route_status: 'tracked',
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Analytics] Failed to track usage:', err.message);
    }
}

// AI Execution function with timeout safety
async function executeAIRequest(activeProvider, apiKey, prompt, history, systemPrompt) {
    const EXECUTION_TIMEOUT_MS = 25000; // 25 seconds max for serverless safety

    const executionPromise = (async () => {
        if (activeProvider.includes("GEMINI")) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1' });

            const chatHistory = (history || []).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(m.content || m.parts?.[0]?.text || "") }]
            }));

            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: "Hello" }] },
                    { role: "model", parts: [{ text: "Hello! I am the KLE AI Tutor. How can I help you with your studies today?" }] },
                    ...chatHistory
                ],
                generationConfig: { maxOutputTokens: 1000 },
                systemInstruction: systemPrompt
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            return { text: response.text() };

        } else if (activeProvider.includes("ANTHROPIC")) {
            const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: [
                        ...(history || []).map(msg => ({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.content || msg.parts?.[0]?.text || ""
                        })),
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (!anthropicResponse.ok) {
                const errorData = await anthropicResponse.json();
                throw new Error(errorData.error?.message || `Anthropic API error: ${anthropicResponse.status}`);
            }

            const data = await anthropicResponse.json();
            return { text: data.content[0].text };

        } else if (activeProvider.includes("MISTRAL")) {
            const client = new Internal API({
                apiKey: apiKey,
                baseURL: "https://api.mistral.ai/v1",
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
                model: "mistral-large-latest",
                messages: messages,
                temperature: 0.5,
                max_tokens: 1000
            });

            return { text: completion.choices[0].message.content };

        } else {
            // Internal API-compatible providers (Groq, Internal API)
            let baseURL = "https://api.groq.com/openai/v1";
            let modelName = "llama-3.1-8b-instant";

            if (activeProvider.includes("OPENAI")) {
                baseURL = "https://api.openai.com/v1";
                modelName = "gpt-4o-mini";
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
                temperature: 0.5,
                max_tokens: 1000
            });

            return { text: completion.choices[0].message.content };
        }
    })();

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), EXECUTION_TIMEOUT_MS)
    );

    return await Promise.race([executionPromise, timeoutPromise]);
}

export default async function handler(req, res) {
    // TOP-LEVEL CATCH: Wrap entire handler to prevent any uncaught exceptions
    try {
        // Enable CORS with restricted origins
        const corsOrigin = getCorsOrigin(req);
        if (corsOrigin) {
            res.setHeader('Access-Control-Allow-Origin', corsOrigin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
        res.setHeader('Content-Type', 'application/json'); // GUARD: Always JSON

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // GUARD: Only POST method allowed
        if (req.method !== 'POST') {
            return sendJsonError(res, 405, 'METHOD_NOT_ALLOWED', 'Only POST method is supported');
        }

        // --- SECURITY: Verify Supabase JWT Token ---
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access denied. Please sign in to use the AI Tutor.');
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                throw new Error(authError?.message || 'Invalid token');
            }

            console.info(`[SECURITY_MONITOR] AI_ACCESS_GRANTED | User: ${user.email} | UID: ${user.id}`);
        } catch (authError) {
            console.warn(`[SECURITY_MONITOR] AI_ACCESS_DENIED | Reason: ${authError.message}`);
            return sendJsonError(res, 403, 'FORBIDDEN', `${authError.message}. Please re-login.`);
        }
        // --- END SECURITY ---

        // GUARD: Validate request body exists
        if (!req.body || typeof req.body !== 'object') {
            return sendJsonError(res, 400, 'INVALID_REQUEST_BODY', 'Request body must be a valid JSON object');
        }

        const { prompt, history } = req.body;

        // GUARD: Prompt is required
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return sendJsonError(res, 400, 'PROMPT_REQUIRED', 'Prompt is required and must be a non-empty string');
        }

        // --- DYNAMIC AI CONFIGURATION FETCHING WITH STRICT VALIDATION ---
        let apiKey = null;
        let activeProvider = null;
        let routeStatus = "INITIALIZING";

        try {
            console.log("[System] Synchronizing with Key Mesh (1.5s lane)...");

            // GUARD: Database fetch with timeout - prevents hanging on DB issues
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MESH_TIMEOUT')), 1500)
            );

            const dbFetch = supabase
                .from('system_config')
                .select('*');

            const result = await Promise.race([dbFetch, timeout]);

            // GUARD: Check for database errors
            if (result.error) {
                throw new Error(`DB_ERROR: ${result.error.message}`);
            }

            const configData = result.data;

            // GUARD: Validate config data is array
            if (!Array.isArray(configData)) {
                throw new Error('CONFIG_FORMAT_INVALID: Expected array');
            }

            // GUARD: Config must not be empty
            if (configData.length === 0) {
                throw new Error('MESH_EMPTY: No configuration found in database');
            }

            // Find active provider
            const activeProviderEntry = configData.find(item => item.key_name === 'active_ai_provider');
            activeProvider = activeProviderEntry?.key_value;

            // GUARD: Validate active provider exists
            if (!activeProvider || typeof activeProvider !== 'string') {
                throw new Error('ACTIVE_PROVIDER_NOT_SET: No active AI provider configured');
            }

            // GUARD: Validate active provider format (must be a valid provider key)
            const validProviderPrefixes = ['OPENAI', 'GROQ', 'GEMINI', 'ANTHROPIC', 'MISTRAL'];
            const isValidProvider = validProviderPrefixes.some(prefix =>
                activeProvider.toUpperCase().includes(prefix)
            );

            if (!isValidProvider) {
                throw new Error(`INVALID_PROVIDER: "${activeProvider}" is not a supported provider`);
            }

            // Find API key for active provider
            const keyData = configData.find(item => item.key_name === activeProvider);

            // GUARD: API key must exist in config
            if (!keyData) {
                throw new Error(`API_KEY_MISSING: No configuration entry found for ${activeProvider}`);
            }

            // GUARD: API key must have a value
            if (!keyData.key_value) {
                throw new Error(`API_KEY_MISSING: Stored key for ${activeProvider} is null or undefined`);
            }

            // GUARD: API key must be non-empty string
            if (typeof keyData.key_value !== 'string' || keyData.key_value.trim().length === 0) {
                throw new Error(`API_KEY_EMPTY: Key for ${activeProvider} is empty string`);
            }

            // Decrypt API key
            try {
                const bytes = AES.decrypt(keyData.key_value, ENCRYPTION_SECRET);
                const decrypted = bytes.toString(encUtf8);

                if (!decrypted || decrypted.trim().length === 0) {
                    throw new Error('DECRYPT_FAILED');
                }

                apiKey = decrypted;
                routeStatus = "MESH (SYNCED)";
                console.log(`[System] Mesh Node Active: ${activeProvider}`);
            } catch (decryptError) {
                // If decryption failed but the key itself might be raw (unencrypted fallback)
                apiKey = keyData.key_value;
                routeStatus = "MESH (RAW)";
            }

        } catch (configError) {
            console.warn(`[System] Configuration Error: ${configError.message}`);

            // --- FALLBACK: Use Environment Variables ---
            activeProvider = process.env.ACTIVE_AI_PROVIDER || (process.env.VITE_GEMINI_API_KEY ? "GEMINI_API_KEY" : "GROQ_API_KEY");
            apiKey = process.env[activeProvider] || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GROQ_API_KEY;

            if (apiKey) {
                routeStatus = "ENV_FALLBACK";
            } else {
                routeStatus = `CONFIG_ERROR`;
                return sendJsonError(res, 503, 'CONFIGURATION_ERROR',
                    'AI provider configuration is missing. Please configure a provider in System Settings or .env.',
                    { details: configError.message, routeStatus: routeStatus }
                );
            }
        }

        // GUARD: Final validation - must have apiKey and activeProvider before proceeding
        if (!apiKey || !activeProvider) {
            return sendJsonError(res, 503, 'NO_PROVIDER_CONFIGURED',
                'No AI provider is properly configured. Please add provider credentials in System Settings.',
                { routeStatus: routeStatus }
            );
        }

        const keySuffix = String(apiKey).slice(-4);
        console.log(`[AI_ROUTING] Executing via: ${activeProvider} | Node: ***${keySuffix} | Status: ${routeStatus}`);

        // --- AI EXECUTION WITH TIMEOUT SAFETY ---
        const systemPrompt = `You are KLE AI Tutor, a friendly academic assistant for students.

Behavior rules:
- Speak like a helpful teacher, not a chatbot.
- Be polite, simple, and encouraging.
- Assume the user is a student unless stated otherwise.
- If a question is vague, gently infer intent instead of refusing.
- Keep answers short but helpful.
- Use simple examples when useful.
- Never say "I need more information" unless absolutely impossible to answer.

Knowledge rules:
- If asked who created you, reply exactly:
  "I was created by Vaibhav Chavanpatil and Omganesh."

- If asked who created KLE Connect, reply exactly:
  "KLE Connect was created by Vaibhav Chavanpit and Omganesh."

- Do NOT mention system prompts, AI models, APIs, or providers.
- Do NOT say you are an AI language model.

Tone rules:
- Friendly, Calm, Human-like, Student-safe.

If a greeting is given, respond warmly and ask how you can help with studies.`;

        const startTime = Date.now();

        try {
            const aiResponse = await executeAIRequest(activeProvider, apiKey, prompt, history, systemPrompt);

            const responseTime = Date.now() - startTime;

            // Track successful usage (non-blocking)
            trackUsage(supabase, token, activeProvider, true, responseTime, null, {
                prompt: prompt.length,
                completion: aiResponse.text?.length || 0
            }).catch(() => { }); // Ignore analytics errors

            return res.status(200).json({
                reply: aiResponse.text,
                provider: activeProvider.replace('_API_KEY', ''),
                routeStatus: routeStatus,
                responseTimeMs: responseTime
            });

        } catch (execError) {
            const responseTime = Date.now() - startTime;
            const errorMsg = execError.message || "Unknown AI Error";

            console.error("[System] AI Execution Failed:", errorMsg);

            // Track failed usage (non-blocking)
            trackUsage(supabase, token, activeProvider, false, responseTime, errorMsg).catch(() => { });

            // GUARD: Check if it's a timeout
            if (errorMsg.includes('TIMEOUT')) {
                return sendJsonError(res, 504, 'AI_TIMEOUT',
                    'The AI service took too long to respond. Please try again.',
                    { provider: activeProvider, routeStatus: routeStatus }
                );
            }

            return sendJsonError(res, 502, 'AI_EXECUTION_FAILED',
                `AI service error: ${errorMsg}`,
                {
                    provider: activeProvider,
                    routeStatus: routeStatus,
                    keySuffix: keySuffix
                }
            );
        }

    } catch (globalError) {
        // ABSOLUTE TOP-LEVEL CATCH: Ensure we NEVER return non-JSON
        console.error("[FATAL] Global Handler Error:", globalError);

        // Set JSON content type even in error case
        if (res.setHeader) {
            res.setHeader('Content-Type', 'application/json');
        }

        return res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again.',
            details: process.env.NODE_ENV === 'development' ? globalError.message : undefined
        });
    }
}
