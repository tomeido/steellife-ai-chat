'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from "@a2a-js/sdk/client";
import { SendMessageSuccessResponse } from "@a2a-js/sdk";
import { Message, MessageSendParams, TextPart } from "@a2a-js/sdk";

const A2A_API_PREFIX = "/api/a2a";
const AGENT_CARD_PATH = `${A2A_API_PREFIX}/.well-known/agent.json`;

interface ChatWidgetProps {
    position?: 'bottom-right' | 'bottom-left';
    primaryColor?: string;
    accentColor?: string;
}

export default function ChatWidget({
    position = 'bottom-right',
    primaryColor = '#8B5A2B',
    accentColor = '#D4A574'
}: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<A2AClient | null>(null);
    const [contextId] = useState<string>(uuidv4());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize A2A client
    useEffect(() => {
        const initializeClient = async () => {
            try {
                const cardUrl = `${window.location.origin}${AGENT_CARD_PATH}`;
                const a2aClient = await A2AClient.fromCardUrl(cardUrl);
                setClient(a2aClient);
            } catch (err) {
                console.error("Failed to initialize A2A client:", err);
                setError("연결 실패 / Connection failed");
            }
        };
        initializeClient();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !client) return;

        const userMessage: Message = {
            kind: "message",
            messageId: uuidv4(),
            role: "user",
            parts: [{ kind: "text", text: input }],
            contextId: contextId,
        };

        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const sendParams: MessageSendParams = {
                message: userMessage,
            };

            const response = await client.sendMessage(sendParams);

            if ("error" in response) {
                throw new Error(response.error.message);
            }

            const resultEvent = (response as SendMessageSuccessResponse).result;

            if (isMessage(resultEvent)) {
                setHistory(prev => [...prev, resultEvent]);
            }

            function isMessage(obj: unknown): obj is Message {
                return Boolean(obj && typeof obj === "object" && obj !== null &&
                    'kind' in obj && (obj as Record<string, unknown>).kind === "message" &&
                    'messageId' in obj && typeof (obj as Record<string, unknown>).messageId === "string");
            }

        } catch (error: unknown) {
            console.error('A2A communication error:', error);
            setError(`오류 발생 / Error: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (message: Message) => {
        return message.parts
            .filter((part): part is TextPart => part.kind === 'text')
            .map((part, index) => <span key={index}>{part.text}</span>);
    };

    const positionStyles = position === 'bottom-right'
        ? { right: '20px', left: 'auto' }
        : { left: '20px', right: 'auto' };

    return (
        <>
            {/* Chat Widget Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    ...positionStyles,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9998,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                }}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '90px',
                        ...positionStyles,
                        width: '380px',
                        height: '520px',
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 9999,
                        animation: 'slideUp 0.3s ease',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                            padding: '16px 20px',
                            color: 'white',
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                            STEELLIFE 고객 지원
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
                            무엇이든 물어보세요 · Ask us anything
                        </p>
                    </div>

                    {/* Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                        }}
                    >
                        {history.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
                                <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                                    안녕하세요! STEELLIFE입니다.<br />
                                    제품, 서비스, 견적 등 무엇이든 물어보세요.
                                </p>
                                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                    We support English, 日本語, 中文
                                </p>
                            </div>
                        ) : (
                            history.map((msg) => (
                                <div
                                    key={msg.messageId}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: '12px',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '80%',
                                            padding: '10px 14px',
                                            borderRadius: msg.role === 'user'
                                                ? '16px 16px 4px 16px'
                                                : '16px 16px 16px 4px',
                                            backgroundColor: msg.role === 'user' ? primaryColor : 'white',
                                            color: msg.role === 'user' ? 'white' : '#333',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            fontSize: '14px',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {renderMessageContent(msg)}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div
                                style={{
                                    padding: '10px',
                                    backgroundColor: '#fee',
                                    borderRadius: '8px',
                                    color: '#c00',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                }}
                            >
                                {error}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'white',
                            borderTop: '1px solid #eee',
                            display: 'flex',
                            gap: '8px',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            disabled={isLoading || !client}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '1px solid #ddd',
                                borderRadius: '20px',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                color: '#333',
                                backgroundColor: 'white',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
                        />

                        <button
                            type="submit"
                            disabled={isLoading || !client}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: primaryColor,
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* CSS Animations */}
            <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background-color: ${accentColor};
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
        </>
    );
}
