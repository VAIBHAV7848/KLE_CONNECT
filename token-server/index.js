const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Load from environment variables
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

if (!APP_ID || !APP_CERTIFICATE) {
    console.error("Error: APP_ID and APP_CERTIFICATE must be set in .env file");
}

app.post('/token', (req, res) => {
    const { channel, uid } = req.body;

    if (!channel) {
        return res.status(400).json({ error: 'channel is required' });
    }

    // Use the provided UID or request 0 for Agora to assign one (but we prefer explicit)
    // If uid is 0 or null, we can default to 0.
    let uidVal = uid;
    if (uidVal === undefined || uidVal === null) {
        uidVal = 0;
    }

    // RtcRole.PUBLISHER = 1, SUBSCRIBER = 2
    const role = RtcRole.PUBLISHER;

    // Token expiration time in seconds (e.g., 1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channel,
            uidVal,
            role,
            privilegeExpiredTs
        );

        console.log(`Token generated for channel: ${channel}, uid: ${uidVal}`);
        res.json({ token, uid: uidVal });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Intelligent Mock AI Tutor Function
function generateMockResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Pattern matching for common topics
    if (lowerPrompt.includes('binary search') || lowerPrompt.includes('bst')) {
        return `🎓 **Binary Search Trees (BST)**\n\n**What is a BST?**\nA Binary Search Tree is a tree data structure where:\n- Each node has at most 2 children (left and right)\n- Left subtree contains nodes with values **less than** the parent\n- Right subtree contains nodes with values **greater than** the parent\n\n**Time Complexity:**\n- Search: O(log n) average, O(n) worst case\n- Insert: O(log n) average, O(n) worst case\n- Delete: O(log n) average, O(n) worst case\n\n**Example:**\n\`\`\`\n     50\n    /  \\\n   30   70\n  / \\   / \\\n 20 40 60 80\n\`\`\`\n\n💡 **Would you like to know about BST traversals or balancing?**`;
    }

    if (lowerPrompt.includes('big o') || lowerPrompt.includes('time complexity')) {
        return `⏱️ **Big O Notation**\n\n**What is Big O?**\nBig O describes the **worst-case** time/space complexity of an algorithm.\n\n**Common Complexities (Best to Worst):**\n- **O(1)** - Constant: Array access, hash table lookup\n- **O(log n)** - Logarithmic: Binary search\n- **O(n)** - Linear: Simple loop, linear search\n- **O(n log n)** - Linearithmic: Merge sort, quick sort\n- **O(n²)** - Quadratic: Nested loops, bubble sort\n- **O(2ⁿ)** - Exponential: Recursive fibonacci\n- **O(n!)** - Factorial: Permutations\n\n**Example:**\n\`\`\`python\n# O(n) - Linear\nfor i in range(n):\n    print(i)\n\n# O(n²) - Quadratic  \nfor i in range(n):\n    for j in range(n):\n        print(i, j)\n\`\`\`\n\n📊 **Need help analyzing a specific algorithm?**`;
    }

    if (lowerPrompt.includes('dbms') || lowerPrompt.includes('database') || lowerPrompt.includes('sql')) {
        return `🗄️ **Database Management Systems (DBMS)**\n\n**Key Concepts:**\n\n**1. ACID Properties:**\n- **A**tomicity: All or nothing\n- **C**onsistency: Valid state always\n- **I**solation: Concurrent transactions don't interfere\n- **D**urability: Committed data persists\n\n**2. Normalization:**\n- **1NF**: Atomic values, no repeating groups\n- **2NF**: 1NF + No partial dependencies\n- **3NF**: 2NF + No transitive dependencies\n- **BCNF**: 3NF + Every determinant is a candidate key\n\n**3. SQL Basics:**\n\`\`\`sql\nSELECT * FROM students WHERE grade > 85;\nINSERT INTO students VALUES (1, 'John', 90);\nUPDATE students SET grade = 95 WHERE id = 1;\nDELETE FROM students WHERE id = 1;\n\`\`\`\n\n🎯 **Want to learn about joins, indexing, or transactions?**`;
    }

    if (lowerPrompt.includes('operating system') || lowerPrompt.includes('os') || lowerPrompt.includes('process') || lowerPrompt.includes('thread')) {
        return `💻 **Operating Systems**\n\n**Core Concepts:**\n\n**1. Process vs Thread:**\n- **Process**: Independent program with own memory\n- **Thread**: Lightweight process, shares memory\n\n**2. CPU Scheduling:**\n- **FCFS**: First Come First Serve\n- **SJF**: Shortest Job First\n- **Round Robin**: Time quantum based\n- **Priority**: Based on priority values\n\n**3. Memory Management:**\n- **Paging**: Fixed-size blocks\n- **Segmentation**: Variable-size blocks\n- **Virtual Memory**: Disk as RAM extension\n\n**4. Deadlock Conditions:**\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\n\n**Prevention**: Break any one condition!\n\n⚙️ **Questions about synchronization or file systems?**`;
    }

    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
        return `👋 **Hello, Student!**\n\nI'm your KLE AI Tutor! I'm here to help you with:\n\n📚 **Computer Science Topics:**\n- Data Structures (Arrays, Trees, Graphs)\n- Algorithms (Sorting, Searching)\n- Big O Notation\n- DBMS & SQL\n- Operating Systems\n- OOP Concepts\n- And much more!\n\n✨ **How I can help:**\n- Explain concepts clearly\n- Provide examples and code\n- Create study plans\n- Quiz you on topics\n\n💡 **Try asking me:**\n- "Explain Binary Search Trees"\n- "What is Big O notation?"\n- "Help me with DBMS"\n- "Quiz me on Operating Systems"\n\n🎓 **What would you like to learn today?**`;
    }

    if (lowerPrompt.includes('study plan') || lowerPrompt.includes('prepare')) {
        return `📅 **Study Plan Generator**\n\n**General CS Study Plan (2 Weeks):**\n\n**Week 1: Foundations**\n- **Day 1-2**: Data Structures (Arrays, Linked Lists)\n- **Day 3-4**: Trees (Binary Trees, BST)\n- **Day 5-6**: Graphs (BFS, DFS)\n- **Day 7**: Review + Practice Problems\n\n**Week 2: Advanced Topics**\n- **Day 8-9**: Algorithms (Sorting, Searching)\n- **Day 10-11**: Dynamic Programming\n- **Day 12-13**: DBMS & SQL\n- **Day 14**: Mock Test + Revision\n\n**Daily Routine:**\n- ⏰ 2 hours theory\n- 💻 1 hour coding practice\n- 📝 30 min revision\n\n🎯 **Need a plan for a specific subject?**`;
    }

    if (lowerPrompt.includes('quiz') || lowerPrompt.includes('test me')) {
        return `📝 **Quick Quiz Time!**\n\n**Question 1:**\nWhat is the time complexity of binary search?\na) O(n)\nb) O(log n)\nc) O(n²)\nd) O(1)\n\n**Question 2:**\nWhich data structure uses LIFO?\na) Queue\nb) Stack\nc) Tree\nd) Graph\n\n**Question 3:**\nWhat does ACID stand for in DBMS?\n\n---\n\n**Answers:**\n1. **b) O(log n)** - Binary search divides the search space in half each time\n2. **b) Stack** - Last In First Out\n3. **Atomicity, Consistency, Isolation, Durability**\n\n🎯 **Want more questions on a specific topic?**`;
    }

    // Default response for unknown queries
    return `🎓 **KLE AI Tutor**\n\nI can help you with: **${prompt}**\n\nWhile I'm working in offline mode, I can still assist with:\n\n📚 **Popular Topics:**\n- Binary Search Trees\n- Big O Notation  \n- Database Management (DBMS)\n- Operating Systems\n- Data Structures & Algorithms\n\n💡 **Try asking:**\n- "Explain [topic]"\n- "Create a study plan for [subject]"\n- "Quiz me on [topic]"\n- "What is [concept]?"\n\n✨ **How can I help you learn today?**`;
}

// AI Chat endpoint
app.post('/api/ai', async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY not found in environment");
            return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

            const chat = model.startChat({
                history: history || [],
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`AI response generated for prompt: "${prompt.substring(0, 50)}..."`);
            return res.status(200).json({ reply: text });
        } catch (geminiError) {
            console.error("Gemini API unavailable, using intelligent mock:", geminiError.message);
            const mockResponse = generateMockResponse(prompt);
            return res.status(200).json({ reply: mockResponse });
        }
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "AI processing failed", details: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Agora Token Server is running');
});

app.listen(PORT, () => {
    console.log(`Token server running on port ${PORT}`);
});
