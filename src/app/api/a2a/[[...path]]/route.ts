import { NextRequest, NextResponse } from "next/server";
import type { AgentCard, JSONRPCErrorResponse, JSONRPCResponse, JSONRPCSuccessResponse } from "@a2a-js/sdk";
import {
    DefaultRequestHandler,
    InMemoryTaskStore,
    JsonRpcTransportHandler,
    A2AError,
} from "@a2a-js/sdk/server";
import { SteellifeExecutor } from "@/lib/steellife-executor";

const AGENT_CARD_PATH = ".well-known/agent.json";

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
