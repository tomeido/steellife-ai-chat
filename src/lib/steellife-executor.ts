import { v4 as uuidv4 } from "uuid";
import type { Message } from "@a2a-js/sdk";
import {
    AgentExecutor,
    RequestContext,
    ExecutionEventBus,
} from "@a2a-js/sdk/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    ChatLog,
    saveChatLog
} from "./log-storage";

export type { ChatLog };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Detect language (simple heuristic)
function detectLanguage(text: string): string {
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese
    if (/[\u4E00-\u9FFF]/.test(text) && !/[\uAC00-\uD7AF]/.test(text)) return 'zh'; // Chinese
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
    return 'en'; // Default to English
}

// In-memory store for conversation history (session-level, separate from persistent logs)
const sessionHistory: Record<string, Message[]> = {};
const sessionLogs: Record<string, ChatLog> = {};

// STEELLIFE Executor
export class SteellifeExecutor implements AgentExecutor {

    async execute(
        requestContext: RequestContext,
        eventBus: ExecutionEventBus
    ): Promise<void> {
        // 1. Load STEELLIFE prompt
        let systemPrompt = "You are a helpful customer service AI for STEELLIFE.";
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/steellife-prompt.txt`);
            if (res.ok) {
                systemPrompt = await res.text();
            } else {
                console.warn("Could not load STEELLIFE prompt file. Using default.");
            }
        } catch (e) {
            console.warn("Could not load STEELLIFE prompt file. Using default.", e);
        }

        // 2. Manage history
        const contextId = requestContext.contextId;
        let chatLog: ChatLog;

        if (!sessionHistory[contextId]) {
            sessionHistory[contextId] = [];

            // Initialize chat log for new session
            chatLog = {
                sessionId: contextId,
                startTime: new Date().toISOString(),
                messages: []
            };
            sessionLogs[contextId] = chatLog;
        } else {
            chatLog = sessionLogs[contextId];
        }

        const history = sessionHistory[contextId];

        // 3. Extract user message
        const incomingMessage = requestContext.userMessage;
        let userText = "";
        if (incomingMessage) {
            history.push(incomingMessage);

            // Extract text for logging
            const textPart = incomingMessage.parts.find(part => part.kind === "text");
            userText = textPart?.text || "";

            // Log user message
            const detectedLang = detectLanguage(userText);
            chatLog.messages.push({
                timestamp: new Date().toISOString(),
                role: "user",
                content: userText,
                language: detectedLang
            });

            // Save to persistent storage
            await saveChatLog(chatLog);
        }

        // 4. Prepare Gemini messages with system prompt
        const geminiMessages = [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            },
            {
                role: "model",
                parts: [{ text: "I understand. I am the STEELLIFE customer service AI assistant. I will respond in the same language the user uses. How may I help you today?" }]
            },
            ...history.map(msg => {
                const textPart = msg.parts.find(part => part.kind === "text");
                return {
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: textPart?.text || "" }]
                };
            })
        ];

        try {
            const result = await model.generateContent({
                contents: geminiMessages
            });
            const geminiResponse = await result.response;
            const geminiText = geminiResponse.text();

            const responseMessage: Message = {
                kind: "message",
                messageId: uuidv4(),
                role: "agent",
                parts: [{ kind: "text", text: geminiText }],
                contextId,
            };
            history.push(responseMessage);

            // Log assistant response
            chatLog.messages.push({
                timestamp: new Date().toISOString(),
                role: "assistant",
                content: geminiText
            });

            // Save to persistent storage
            await saveChatLog(chatLog);

            eventBus.publish(responseMessage);
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: Message = {
                kind: "message",
                messageId: uuidv4(),
                role: "agent",
                parts: [{ kind: "text", text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. / Sorry, a temporary error occurred. Please try again later." }],
                contextId,
            };
            history.push(errorMessage);
            eventBus.publish(errorMessage);
        } finally {
            eventBus.finished();
        }
    }

    cancelTask = async (): Promise<void> => { };
}
