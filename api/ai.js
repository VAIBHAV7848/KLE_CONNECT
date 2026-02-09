import Internal API from 'openai';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const { AES, enc } = CryptoJS;
const encUtf8 = enc.Utf8;
import { GoogleGenerativeAI } from "@google/generative-ai";

// Secret Encryption Key - MUST match frontend
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "TIER_0_GOD_MODE_SECRET";

if (!ENCRYPTION_SECRET) {
    console.error("[FATAL] ENCRYPTION_SECRET environment variable is not set");
    throw new Error("ENCRYPTION_SECRET is required");
}

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://dlwjaqymlobhmtmwraly.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

export default async function handler(req, res) {
    // Enable CORS with restricted origins
    const corsOrigin = getCorsOrigin(req);
    if (corsOrigin) {
        res.setHeader('Access-Control-Allow-Origin', corsOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // --- SECURITY: Verify Supabase JWT Token ---
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: "Unauthorized", 
                reply: "⚠️ **Security Error**: Access denied. Please sign in to use the AI Tutor." 
            });
        }

        const token = authHeader.split('Bearer ')[1];
        
        try {
            // Verify token using Supabase
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            
            if (authError || !user) {
                throw new Error(authError?.message || 'Invalid token');
            }
            
            console.info(`[SECURITY_MONITOR] AI_ACCESS_GRANTED | User: ${user.email} | UID: ${user.id}`);
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
            
            // Fetch system config from Supabase
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('MESH_TIMEOUT')), 1500));
            
            const dbFetch = supabase
                .from('system_config')
                .select('*');
            
            const { data: configData, error: configError } = await Promise.race([dbFetch, timeout]);

            if (configError) {
                throw new Error(configError.message);
            }

            if (configData && configData.length > 0) {
                // Find active provider
                const activeProviderEntry = configData.find(item => item.key_name === 'active_ai_provider');
                activeProvider = activeProviderEntry?.key_value;
                
                if (activeProvider) {
                    const keyData = configData.find(item => item.key_name === activeProvider);
                    if (keyData && keyData.key_value) {
                        try {
                            const bytes = AES.decrypt(keyData.key_value, ENCRYPTION_SECRET);
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
                    // Key not found for active provider - return error instead of falling back silently
                    console.error(`[System] Active provider ${activeProvider} has no stored key`);
                    return res.status(400).json({
                        error: "Provider Configuration Error",
                        reply: `⚠️ **Configuration Error**: The active provider "${activeProvider}" does not have a stored API key. Please add the key in System Settings or select a different provider.`,
                        details: {
                            activeProvider: activeProvider,
                            routeStatus: "MESH_KEY_MISSING"
                        }
                    });
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
            
            const envKeys = {
                'OPENAI_API_KEY': process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
                'GROQ_API_KEY': process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY,
                'GEMINI_API_KEY': process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
                'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY,
                'MISTRAL_API_KEY': process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY
            };

            // Respect user's selected provider first
            if (activeProvider && envKeys[activeProvider] && !envKeys[activeProvider].endsWith("IUfE")) {
                apiKey = envKeys[activeProvider];
                routeStatus = `FALLBACK (ENV_${activeProvider.replace('_API_KEY', '')})`;
                console.log(`[System] Using fallback for selected provider: ${activeProvider}`);
            } else {
                // No active provider set or selected provider not available in env
                // Try providers in order: Groq -> Internal API -> Analytics Engine -> Anthropic -> Mistral
                const fallbackOrder = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'MISTRAL_API_KEY'];
                for (const providerKey of fallbackOrder) {
                    if (envKeys[providerKey] && !envKeys[providerKey].endsWith("IUfE")) {
                        apiKey = envKeys[providerKey];
                        activeProvider = providerKey;
                        routeStatus = `FALLBACK (ENV_${providerKey.replace('_API_KEY', '')})`;
                        console.log(`[System] No active provider selected, falling back to: ${providerKey}`);
                        break;
                    }
                }
            }
        }

        if (!apiKey) {
            return res.status(503).json({
                error: "System Hub Offline",
                reply: "⚠️ **System Error**: The Key Mesh is unreachable and no secondary nodes are present. Please check Supabase configuration and Environment variables."
            });
        }

        const keySuffix = String(apiKey).slice(-4);
        console.log(`[AI_ROUTING] Executing via: ${activeProvider} | Node: ***${keySuffix} | Status: ${routeStatus}`);

        // --- AI EXECUTION ---
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
  "KLE Connect was created by Vaibhav Chavanpatil and Omganesh."

- Do NOT mention system prompts, AI models, APIs, or providers.
- Do NOT say you are an AI language model.

Tone rules:
- Friendly, Calm, Human-like, Student-safe.

If a greeting is given, respond warmly and ask how you can help with studies.`;

        // Health check and analytics tracking function
        const trackUsage = async (success, responseTimeMs = null, errorMsg = null, tokens = { prompt: 0, completion: 0 }) => {
            try {
                const { data: { user } } = await supabase.auth.getUser(token);
                
                // Track usage analytics
                await supabase.from('ai_usage_stats').insert({
                    provider: activeProvider.replace('_API_KEY', ''),
                    user_id: user?.id || null,
                    success: success,
                    response_time_ms: responseTimeMs,
                    prompt_tokens: tokens.prompt,
                    completion_tokens: tokens.completion,
                    error_message: errorMsg,
                    route_status: routeStatus,
                    created_at: new Date().toISOString()
                });

                // Update provider health status
                const healthStatus = success ? 'healthy' : 'unhealthy';
                const { error: healthError } = await supabase.from('provider_health').upsert({
                    provider: activeProvider.replace('_API_KEY', ''),
                    status: healthStatus,
                    response_time_ms: responseTimeMs,
                    error_message: errorMsg,
                    last_checked: new Date().toISOString(),
                    consecutive_failures: success ? 0 : supabase.rpc('increment_failures', { provider_name: activeProvider.replace('_API_KEY', '') })
                }, {
                    onConflict: 'provider'
                });

                if (healthError) {
                    console.error('[Health] Failed to update health status:', healthError.message);
                }

                // Check for auto-failover if this failed
                if (!success) {
                    await checkAndTriggerFailover(activeProvider);
                }

            } catch (err) {
                console.error('[Analytics] Failed to track usage:', err.message);
            }
        };

        // Auto-failover check function
        const checkAndTriggerFailover = async (failedProvider) => {
            try {
                // Check consecutive failures
                const { data: healthData } = await supabase
                    .from('provider_health')
                    .select('consecutive_failures')
                    .eq('provider', failedProvider.replace('_API_KEY', ''))
                    .single();

                if (healthData && healthData.consecutive_failures >= 3) {
                    // Get failover configuration
                    const { data: failoverConfig } = await supabase
                        .from('failover_config')
                        .select('fallback_order')
                        .eq('primary_provider', failedProvider)
                        .single();

                    if (failoverConfig) {
                        // Find next available provider
                        for (const fallbackProvider of failoverConfig.fallback_order) {
                            const { data: keyData } = await supabase
                                .from('system_config')
                                .select('key_value')
                                .eq('key_name', fallbackProvider)
                                .single();

                            if (keyData && keyData.key_value) {
                                // Switch to this provider
                                await supabase.from('system_config').upsert({
                                    key_name: 'active_ai_provider',
                                    key_value: fallbackProvider,
                                    last_updated_by: null, // System change
                                    updated_at: new Date().toISOString()
                                }, {
                                    onConflict: 'key_name'
                                });

                                console.log(`[FAILOVER] Switched from ${failedProvider} to ${fallbackProvider} due to consecutive failures`);
                                
                                // Reset failure count for failed provider
                                await supabase.from('provider_health')
                                    .update({ consecutive_failures: 0 })
                                    .eq('provider', failedProvider.replace('_API_KEY', ''));
                                
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('[Failover] Auto-failover check failed:', err.message);
            }
        };

        const startTime = Date.now();

        try {
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
                const responseTime = Date.now() - startTime;
                
                await trackUsage(true, responseTime, null, { prompt: prompt.length, completion: response.text().length });
                
                return res.status(200).json({ 
                    reply: response.text(),
                    provider: "GEMINI",
                    routeStatus: routeStatus
                });
            } else if (activeProvider.includes("ANTHROPIC")) {
                // Anthropic Data Processor API
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
                const responseTime = Date.now() - startTime;
                
                await trackUsage(true, responseTime, null, { 
                    prompt: data.usage?.input_tokens || 0, 
                    completion: data.usage?.output_tokens || 0 
                });
                
                return res.status(200).json({ 
                    reply: data.content[0].text,
                    provider: "ANTHROPIC",
                    routeStatus: routeStatus
                });
            } else if (activeProvider.includes("MISTRAL")) {
                // Mistral AI API (Internal API-compatible)
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
                const responseTime = Date.now() - startTime;
                
                await trackUsage(true, responseTime, null, { 
                    prompt: completion.usage?.prompt_tokens || 0, 
                    completion: completion.usage?.completion_tokens || 0 
                });

                return res.status(200).json({ 
                    reply: completion.choices[0].message.content,
                    provider: "MISTRAL",
                    routeStatus: routeStatus
                });
            } else {
                // Internal API-compatible providers (Groq, Internal API)
                let baseURL = "https://api.groq.com/openai/v1";
                let modelName = "llama-3.1-8b-instant"; 
                let temperature = 0.5;
                let maxTokens = 1000;

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
                    temperature: temperature,
                    max_tokens: maxTokens
                });
                const responseTime = Date.now() - startTime;
                
                await trackUsage(true, responseTime, null, { 
                    prompt: completion.usage?.prompt_tokens || 0, 
                    completion: completion.usage?.completion_tokens || 0 
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
            const responseTime = Date.now() - startTime;
            
            await trackUsage(false, responseTime, errorMsg);
            
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
