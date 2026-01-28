import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import type { AgentCard, Message, JSONRPCErrorResponse, JSONRPCResponse, JSONRPCSuccessResponse } from "@a2a-js/sdk";
import {
    AgentExecutor,
    RequestContext,
    ExecutionEventBus,
    DefaultRequestHandler,
    InMemoryTaskStore,
    JsonRpcTransportHandler,
    A2AError,
} from "@a2a-js/sdk/server";
const AGENT_CARD_PATH = ".well-known/agent.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

// STEELLIFE Agent Card
const steellifeAgentCard: AgentCard = {
  name: "STEELLIFE Customer Service AI",
  description: "An AI customer service agent for STEELLIFE (주식회사 스틸라이프), a Korean architectural steel panel manufacturer. Supports multiple languages including Korean, English, Japanese, and Chinese. Can answer questions about products, services, and company information.",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/api/a2a",
  capabilities: {},
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "customer-support",
      name: "Customer Support",
      description: "Answers questions about STEELLIFE products, services, certifications, and contact information in multiple languages.",
      tags: ["customer-service", "multilingual", "steel-panels", "architecture"]
    }
  ],
};


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Chat log interface
interface ChatLog {
    sessionId: string;
    startTime: string;
    messages: {
        timestamp: string;
        role: string;
        content: string;
        language?: string;
    }[];
}

// In-memory log storage (for development - in production use Vercel Blob/KV)
const chatLogs: Map<string, ChatLog> = new Map();

// Detect language (simple heuristic)
function detectLanguage(text: string): string {
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese
    if (/[\u4E00-\u9FFF]/.test(text) && !/[\uAC00-\uD7AF]/.test(text)) return 'zh'; // Chinese
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
    return 'en'; // Default to English
}

// STEELLIFE Executor
class SteellifeExecutor implements AgentExecutor {
    private static historyStore: Record<string, Message[]> = {};

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
        if (!SteellifeExecutor.historyStore[contextId]) {
            SteellifeExecutor.historyStore[contextId] = [];
            
            // Initialize chat log
            chatLogs.set(contextId, {
                sessionId: contextId,
                startTime: new Date().toISOString(),
                messages: []
            });
        }
        const history = SteellifeExecutor.historyStore[contextId];
        const chatLog = chatLogs.get(contextId);

        // 3. Extract user message
        const incomingMessage = requestContext.userMessage;
        let userText = "";
        if (incomingMessage) {
            history.push(incomingMessage);
            
            // Extract text for logging
            const textPart = incomingMessage.parts.find(part => part.kind === "text");
            userText = textPart?.text || "";
            
            // Log user message
            if (chatLog) {
                const detectedLang = detectLanguage(userText);
                chatLog.messages.push({
                    timestamp: new Date().toISOString(),
                    role: "user",
                    content: userText,
                    language: detectedLang
                });
            }
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
            if (chatLog) {
                chatLog.messages.push({
                    timestamp: new Date().toISOString(),
                    role: "assistant",
                    content: geminiText
                });
            }
            
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

    // Get chat log for a session
    static getChatLog(contextId: string): ChatLog | undefined {
        return chatLogs.get(contextId);
    }

    // Get all chat logs
    static getAllChatLogs(): ChatLog[] {
        return Array.from(chatLogs.values());
    }

    cancelTask = async (): Promise<void> => {};
}

// Export for use in logs API
export { SteellifeExecutor, chatLogs };
export type { ChatLog };

// Set up the A2A request handler and transport handler
const agentExecutor = new SteellifeExecutor();
const requestHandler = new DefaultRequestHandler(
    steellifeAgentCard,
    new InMemoryTaskStore(),
    agentExecutor
);
const jsonRpcTransportHandler = new JsonRpcTransportHandler(requestHandler);


export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path?: string[] }> }
) {
    const { params } = context;
    const resolvedParams = await params;
    const currentPath = resolvedParams.path?.join('/') || '';

    // === GET /.well-known/agent-card.json ===
    if (currentPath === AGENT_CARD_PATH) {
        try {
            const agentCard = await requestHandler.getAgentCard();
            return NextResponse.json(agentCard);
        } catch (error: unknown) {
            console.error("Error fetching agent card:", error);
            return NextResponse.json(
                { error: "Failed to retrieve agent card" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path?: string[] }> }
) {
    const { params } = context;
    const resolvedParams = await params;
    const currentPath = resolvedParams.path?.join('/') || '';

    // === POST / ===
    if (currentPath === '') {
        try {
            const body = await request.json();
            const rpcResponseOrStream = await jsonRpcTransportHandler.handle(body);

            if (typeof (rpcResponseOrStream as unknown as Record<string | symbol, unknown>)?.[Symbol.asyncIterator] === 'function') {
                const stream = rpcResponseOrStream as AsyncGenerator<JSONRPCSuccessResponse, void, undefined>;

                const readable = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const event of stream) {
                                controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
                            }
                        } catch (streamError: unknown) {
                            console.error(`Error during SSE streaming (request ${body?.id}):`, streamError);
                            const a2aError = streamError instanceof A2AError ? streamError : A2AError.internalError((streamError as Error).message || 'Streaming error.');
                            const errorResponse: JSONRPCErrorResponse = {
                                jsonrpc: '2.0',
                                id: body?.id || null,
                                error: a2aError.toJSONRPCError(),
                            };
                            controller.enqueue(`event: error\n`);
                            controller.enqueue(`data: ${JSON.stringify(errorResponse)}\n\n`);
                        } finally {
                            controller.close();
                        }
                    }
                });

                return new Response(readable, {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    }
                });
            } else {
                const rpcResponse = rpcResponseOrStream as JSONRPCResponse;
                return NextResponse.json(rpcResponse);
            }
        } catch (error: unknown) {
            console.error("Unhandled error in A2A POST handler:", error);
            const a2aError = error instanceof A2AError ? error : A2AError.internalError('General processing error.');
            const errorResponse: JSONRPCErrorResponse = {
                jsonrpc: '2.0',
                id: null,
                error: a2aError.toJSONRPCError(),
            };
            return NextResponse.json(errorResponse, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
