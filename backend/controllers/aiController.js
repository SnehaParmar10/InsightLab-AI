import prisma from '../config/prisma.js';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://127.0.0.1:8000';

// ==========================================
// DATABASE PERSISTENCE HELPERS
// ==========================================

const detectTopic = (inputString) => {
    const text = inputString.toLowerCase();
    if (text.includes("osi") || text.includes("network") || text.includes("ip") || text.includes("tcp") || text.includes("udp") || text.includes("port")) {
        return "osi";
    }
    if (text.includes("binary") || text.includes("search") || text.includes("find")) {
        return "binary_search";
    }
    if (text.includes("stack") || text.includes("queue") || text.includes("lifo") || text.includes("fifo") || text.includes("push") || text.includes("pop")) {
        return "stack_queue";
    }
    if (text.includes("sort") || text.includes("bubble") || text.includes("quick") || text.includes("merge") || text.includes("order")) {
        return "sorting";
    }
    return "general";
};

const getConceptName = (topicKey, query) => {
    if (topicKey === "osi") return "OSI Model";
    if (topicKey === "binary_search") return "Binary Search";
    if (topicKey === "stack_queue") return "Stack & Queue";
    if (topicKey === "sorting") return "Sorting Algorithms";
    return query.substring(0, 30) || "General Study";
};

const saveConceptRequest = async (userId, topicKey, query, textReply, notesContent, simulationHtml) => {
    try {
        const conceptName = getConceptName(topicKey, query);
        
        // 1. Get user interests
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { interests: true }
        });
        const interest = (user && user.interests && user.interests.length > 0) 
            ? user.interests[0] 
            : "General Learning";

        // 2. Find or create Concept
        let concept = await prisma.concept.findUnique({
            where: { name: conceptName }
        });
        if (!concept) {
            concept = await prisma.concept.create({
                data: {
                    name: conceptName,
                    description: `Study module for ${conceptName}`,
                    prerequisites: []
                }
            });
        }

        // 3. Create or update ConceptRequest
        let reqRecord = await prisma.conceptRequest.findFirst({
            where: { userId, conceptId: concept.id }
        });

        if (reqRecord) {
            reqRecord = await prisma.conceptRequest.update({
                where: { id: reqRecord.id },
                data: {
                    analogyInterest: interest,
                    analogyContent: textReply || reqRecord.analogyContent,
                    smartNotes: notesContent || reqRecord.smartNotes,
                    d3VisualizationJson: simulationHtml ? { html: simulationHtml } : (reqRecord.d3VisualizationJson || {})
                }
            });
        } else {
            reqRecord = await prisma.conceptRequest.create({
                data: {
                    userId,
                    conceptId: concept.id,
                    analogyInterest: interest,
                    analogyContent: textReply || "Concept explanation",
                    smartNotes: notesContent || "Study notes content",
                    d3VisualizationJson: simulationHtml ? { html: simulationHtml } : {},
                    roadmapResourceLinks: []
                }
            });
        }
        return reqRecord;
    } catch (err) {
        console.error("Database saveConceptRequest error:", err);
        return null;
    }
};

const saveQuizQuestions = async (userId, topicKey, topic, questions) => {
    try {
        const reqRecord = await saveConceptRequest(userId, topicKey, topic, `Quiz generation for ${topic}`, `Notes for ${topic}`, null);
        if (!reqRecord) return null;

        // Delete old quiz questions for this request
        await prisma.quizQuestion.deleteMany({
            where: { conceptRequestId: reqRecord.id }
        });

        // Insert new quiz questions
        const insertPromises = questions.map(q => {
            return prisma.quizQuestion.create({
                data: {
                    conceptRequestId: reqRecord.id,
                    questionText: q.q,
                    options: q.opts,
                    correctOption: String(q.ans),
                    explanation: `Correct option is Option ${String.fromCharCode(65 + q.ans)}`
                }
            });
        });
        await Promise.all(insertPromises);
        return reqRecord.id;
    } catch (err) {
        console.error("Database saveQuizQuestions error:", err);
        return null;
    }
};

// ==========================================
// CONVERSATIONS & MESSAGES CRUD
// ==========================================

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const list = await prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(list);
    } catch (error) {
        console.error("Error in getConversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations." });
    }
};

export const createConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;
        const conv = await prisma.conversation.create({
            data: {
                userId,
                title: title || "New Chat",
                quizQuestions: [],
                quizState: {}
            }
        });
        res.status(201).json(conv);
    } catch (error) {
        console.error("Error in createConversation:", error);
        res.status(500).json({ error: "Failed to create conversation." });
    }
};

export const updateConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, quizQuestions, quizState } = req.body;
        const userId = req.user.id;

        const existing = await prisma.conversation.findFirst({
            where: { id, userId }
        });
        if (!existing) return res.status(404).json({ error: "Conversation not found." });

        const updated = await prisma.conversation.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existing.title,
                quizQuestions: quizQuestions !== undefined ? quizQuestions : existing.quizQuestions,
                quizState: quizState !== undefined ? quizState : existing.quizState
            }
        });
        res.json(updated);
    } catch (error) {
        console.error("Error in updateConversation:", error);
        res.status(500).json({ error: "Failed to update conversation." });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await prisma.conversation.findFirst({
            where: { id, userId }
        });
        if (!existing) return res.status(404).json({ error: "Conversation not found." });

        await prisma.conversation.delete({
            where: { id }
        });
        res.json({ success: true, message: "Conversation deleted successfully." });
    } catch (error) {
        console.error("Error in deleteConversation:", error);
        res.status(500).json({ error: "Failed to delete conversation." });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const conv = await prisma.conversation.findFirst({
            where: { id, userId }
        });
        if (!conv) return res.status(404).json({ error: "Conversation not found." });

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ error: "Failed to fetch messages." });
    }
};

export const createMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { sender, text, notes, simulation } = req.body;
        const userId = req.user.id;

        const conv = await prisma.conversation.findFirst({
            where: { id, userId }
        });
        if (!conv) return res.status(404).json({ error: "Conversation not found." });

        const msg = await prisma.message.create({
            data: {
                conversationId: id,
                sender,
                text,
                notes: notes || null,
                simulation: simulation || null
            }
        });

        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(msg);
    } catch (error) {
        console.error("Error in createMessage:", error);
        res.status(500).json({ error: "Failed to save message." });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const userId = req.user.id;

        // Verify conversation belongs to user
        const conv = await prisma.conversation.findFirst({
            where: { id, userId }
        });
        if (!conv) return res.status(404).json({ error: "Conversation not found." });

        await prisma.message.delete({
            where: { id: messageId }
        });

        res.json({ success: true, message: "Message deleted successfully." });
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        res.status(500).json({ error: "Failed to delete message." });
    }
};

// ==========================================
// EXPRESS ROUTE ENDPOINTS
// ==========================================

export const chatWithTutor = async (req, res) => {
    try {
        const { messages, conversationId } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid request. messages must be an array." });
        }
        
        const lastUserQuery = [...messages].reverse().find(msg => msg.sender === 'user')?.text || "";
        const topicKey = detectTopic(lastUserQuery);

        let createdUserMsgId = undefined;
        let createdAiMsgId = undefined;

        // 1. Immediately save user message to DB if conversationId is provided
        if (conversationId) {
            try {
                const lastUserMsg = messages[messages.length - 1];
                if (lastUserMsg && lastUserMsg.sender === 'user') {
                    const uMsg = await prisma.message.create({
                        data: {
                            conversationId,
                            sender: 'user',
                            text: lastUserMsg.text
                        }
                    });
                    createdUserMsgId = uMsg.id;

                    const currentConv = await prisma.conversation.findUnique({ where: { id: conversationId } });
                    if (currentConv && currentConv.title.startsWith("New Chat")) {
                        let titleUpdate = {};
                        if (currentConv.title.startsWith("New Chat") || (messages.length === 2 && messages[0].text.startsWith("Hi! Ask me"))) {
                            titleUpdate.title = lastUserMsg.text.length > 25 
                                ? lastUserMsg.text.substring(0, 25) + '...' 
                                : lastUserMsg.text;
                        }
                        await prisma.conversation.update({
                            where: { id: conversationId },
                            data: { updatedAt: new Date(), ...titleUpdate }
                        });
                    }
                }
            } catch (dbErr) {
                console.error("Failed to save user chat message in DB:", dbErr);
            }
        }

        console.log(`[GATEWAY] Forwarding chat request to FastAPI agent...`);
        const agentResponse = await fetch(`${AI_AGENT_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        
        if (!agentResponse.ok) {
            const errText = await agentResponse.text();
            throw new Error(`AI Agent service returned error: ${errText}`);
        }
        
        const data = await agentResponse.json();
        
        // Save concept request to DB
        await saveConceptRequest(req.user.id, topicKey, lastUserQuery, data.text, data.notes, null);
        
        // 2. Save AI message to DB if conversationId is provided
        if (conversationId) {
            try {
                const aiMsg = await prisma.message.create({
                    data: {
                        conversationId,
                        sender: 'ai',
                        text: data.text,
                        notes: data.notes || null,
                        simulation: data.simulation || null
                    }
                });
                createdAiMsgId = aiMsg.id;

                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() }
                });
            } catch (dbErr) {
                console.error("Failed to save AI chat message in DB:", dbErr);
            }
        }
        
        res.json({ ...data, userMsgId: createdUserMsgId, aiMsgId: createdAiMsgId });
    } catch (error) {
        console.error("Error in chatWithTutor gateway:", error);
        res.status(500).json({ error: error.message || "Failed to process chat with AI agent." });
    }
};

export const generateQuiz = async (req, res) => {
    try {
        const { topic, conversationId } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: "Invalid request. topic is required." });
        }
        
        const topicKey = detectTopic(topic);

        console.log(`[GATEWAY] Forwarding quiz request to FastAPI agent...`);
        const agentResponse = await fetch(`${AI_AGENT_URL}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });
        
        if (!agentResponse.ok) {
            const errText = await agentResponse.text();
            throw new Error(`AI Agent service returned error: ${errText}`);
        }
        
        const data = await agentResponse.json();
        // Save questions and get conceptRequestId
        const conceptRequestId = await saveQuizQuestions(req.user.id, topicKey, topic, data.questions);
        
        // Save quiz questions to the latest AI message in the conversation
        if (conversationId) {
            try {
                const latestAiMessage = await prisma.message.findFirst({
                    where: { conversationId, sender: 'ai' },
                    orderBy: { createdAt: 'desc' }
                });

                if (latestAiMessage) {
                    await prisma.message.update({
                        where: { id: latestAiMessage.id },
                        data: {
                            quizQuestions: data.questions,
                            quizState: { currentQ: 0, score: 0, submitted: false, quizDone: false }
                        }
                    });
                }
                
                // Keep global conversation sync for backward compatibility (optional but safe)
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { 
                        quizQuestions: data.questions,
                        quizState: { currentQ: 0, score: 0, submitted: false, quizDone: false }
                    }
                });
            } catch (dbErr) {
                console.error("Failed to save quiz to message record:", dbErr);
            }
        }
        
        res.json({ questions: data.questions, conceptRequestId });
    } catch (error) {
        console.error("Error in generateQuiz gateway:", error);
        res.status(500).json({ error: error.message || "Failed to generate quiz." });
    }
};



export const submitQuizAttempt = async (req, res) => {
    try {
        const { conceptRequestId, score } = req.body;
        if (!conceptRequestId || score === undefined) {
            return res.status(400).json({ error: "conceptRequestId and score are required." });
        }

        const numericScore = parseInt(score, 10);
        const passed = numericScore >= 60; // 60% passing score (e.g. 3 out of 5 correct)

        const attempt = await prisma.quizAttempt.create({
            data: {
                userId: req.user.id,
                conceptRequestId,
                score: numericScore,
                passed
            }
        });

        // Diagnose user weak area if they fail
        if (!passed) {
            const reqRecord = await prisma.conceptRequest.findUnique({
                where: { id: conceptRequestId },
                select: { conceptId: true }
            });
            if (reqRecord) {
                const existingWeak = await prisma.weakArea.findFirst({
                    where: { userId: req.user.id, conceptId: reqRecord.conceptId }
                });
                if (existingWeak) {
                    await prisma.weakArea.update({
                        where: { id: existingWeak.id },
                        data: {
                            attemptCount: existingWeak.attemptCount + 1,
                            resolved: false
                        }
                    });
                } else {
                    await prisma.weakArea.create({
                        data: {
                            userId: req.user.id,
                            conceptId: reqRecord.conceptId,
                            misconceptionTag: "Gaps in conceptual knowledge identified from quiz performance",
                            attemptCount: 1,
                            resolved: false
                        }
                    });
                }
            }
        }

        res.json({ success: true, attempt });
    } catch (error) {
        console.error("Error in submitQuizAttempt:", error);
        res.status(500).json({ error: error.message || "Failed to save quiz attempt." });
    }
};

export const updateMessage = async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const updates = req.body; // e.g. { quizState: {...} }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: updates
        });

        res.json(updated);
    } catch (error) {
        console.error("Error updating message:", error);
        res.status(500).json({ error: "Failed to update message" });
    }
};

export const analyzeConversation = async (req, res) => {
    try {
        const { conversationId } = req.body;
        if (!conversationId) return res.status(400).json({ error: "conversationId is required" });

        // Fetch the conversation history to analyze
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 20 // Analyze last 20 messages
        });

        const contextString = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

        const aiResponse = await fetch(`${AI_AGENT_URL}/simulation/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_context: contextString || "General CS and Engineering" })
        });

        if (!aiResponse.ok) {
            const errData = await aiResponse.json().catch(() => ({}));
            throw new Error(errData.error || `AI server error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        res.json(data);
    } catch (error) {
        console.error("Error in analyzeConversation:", error);
        res.status(500).json({ error: error.message || "Failed to analyze conversation" });
    }
};

export const generateSimulation = async (req, res) => {
    try {
        console.log("generateSimulation called:", req.body);
        const { conversationId, title } = req.body;
        if (!conversationId || !title) return res.status(400).json({ error: "conversationId and title are required" });

        // Fetch last user message for general topic fallback if needed by python
        const lastMsg = await prisma.message.findFirst({
            where: { conversationId, sender: 'user' },
            orderBy: { createdAt: 'desc' }
        });
        const topic = lastMsg ? lastMsg.text.substring(0, 50) : "General";

        const aiResponse = await fetch(`${AI_AGENT_URL}/simulation/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, topic })
        });

        if (!aiResponse.ok) {
            const errData = await aiResponse.json().catch(() => ({}));
            throw new Error(errData.error || `AI server error: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();

        if (data.simulation) {
            // Save this simulation in the database as a new AI message so it stays in history
            const aiMsg = await prisma.message.create({
                data: {
                    conversationId,
                    sender: 'ai',
                    text: `Here is the interactive lab for: ${title}`,
                    simulation: data.simulation
                }
            });
            
            return res.json({ simulation: data.simulation, newMessages: [aiMsg] });
        }

        res.json(data);
    } catch (error) {
        console.error("Error in generateSimulation:", error);
        res.status(500).json({ error: error.message || "Failed to generate simulation" });
    }
};

