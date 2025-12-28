const Internal API = require('openai');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
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

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(200).json({
                reply: "⚠️ **System Error**: GROQ_API_KEY not found in Vercel environment variables."
            });
        }

        const client = new Internal API({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const messages = [
            {
                role: "system",
                content: "You are the KLE AI Tutor, a friendly academic companion. Style Guide: Use emojis 🎓✨. Format with clear Markdown. ALWAYS end with a follow-up question."
            }
        ];

        if (history && history.length > 0) {
            history.forEach(msg => {
                messages.push({
                    role: msg.role === 'model' ? 'assistant' : msg.role,
                    content: msg.parts ? msg.parts[0].text : msg.content
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

        res.status(200).json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error("Vercel AI Error:", error);
        res.status(500).json({ error: "AI processing failed", details: error.message });
    }
};
