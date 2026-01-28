'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ChatMessage {
    timestamp: string;
    role: string;
    content: string;
    language?: string;
}

interface ChatLog {
    sessionId: string;
    startTime: string;
    messages: ChatMessage[];
}

interface LogsResponse {
    total: number;
    logs: ChatLog[];
}

export default function LogsPage() {
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);
    const [stats, setStats] = useState<{
        totalSessions: number;
        totalMessages: number;
        languageBreakdown: Record<string, number>;
    } | null>(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs');
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data: LogsResponse = await response.json();
            setLogs(data.logs);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/logs', { method: 'POST' });
            if (!response.ok) return;
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLanguageName = (code: string) => {
        const names: Record<string, string> = {
            ko: '한국어',
            en: 'English',
            ja: '日本語',
            zh: '中文',
        };
        return names[code] || code;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a2e',
                color: 'white',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
                    <p>로그를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#1a1a2e',
            color: 'white',
            fontFamily: "'Pretendard', -apple-system, sans-serif",
        }}>
            {/* Header */}
            <header style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                        📊 STEELLIFE 챗봇 로그
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        고객 문의 내역 관리
                    </p>
                </div>
                <Link
                    href="/"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#8B5A2B',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '14px',
                    }}
                >
                    홈으로
                </Link>
            </header>

            {/* Stats */}
            {stats && (
                <div style={{
                    padding: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#D4A574' }}>
                            {stats.totalSessions}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                            총 세션
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#D4A574' }}>
                            {stats.totalMessages}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                            총 메시지
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ fontSize: '14px', marginBottom: '8px', color: 'rgba(255,255,255,0.6)' }}>
                            언어별 질문
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {Object.entries(stats.languageBreakdown).map(([lang, count]) => (
                                <span key={lang} style={{
                                    padding: '4px 12px',
                                    background: 'rgba(212, 165, 116, 0.2)',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                }}>
                                    {getLanguageName(lang)}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: selectedLog ? '1fr 1fr' : '1fr',
                gap: '24px',
                padding: '0 24px 24px',
            }}>
                {/* Logs List */}
                <div>
                    <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
                        세션 목록 ({logs.length})
                    </h2>

                    {error && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255,0,0,0.1)',
                            borderRadius: '8px',
                            color: '#ff6b6b',
                            marginBottom: '16px',
                        }}>
                            {error}
                        </div>
                    )}

                    {logs.length === 0 ? (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            color: 'rgba(255,255,255,0.5)',
                        }}>
                            아직 대화 로그가 없습니다.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {logs.map((log) => (
                                <div
                                    key={log.sessionId}
                                    onClick={() => setSelectedLog(log)}
                                    style={{
                                        padding: '16px',
                                        background: selectedLog?.sessionId === log.sessionId
                                            ? 'rgba(212, 165, 116, 0.2)'
                                            : 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        border: selectedLog?.sessionId === log.sessionId
                                            ? '1px solid rgba(212, 165, 116, 0.5)'
                                            : '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                                            {log.sessionId.substring(0, 8)}...
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                            {formatDate(log.startTime)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px' }}>
                                        {log.messages.length} 메시지
                                    </div>
                                    {log.messages[0] && (
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'rgba(255,255,255,0.6)',
                                            marginTop: '8px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            첫 질문: {log.messages.find(m => m.role === 'user')?.content.substring(0, 50) || '...'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Log Detail */}
                {selectedLog && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div>
                                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>대화 상세</h3>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                                    {selectedLog.sessionId}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{
                            padding: '16px',
                            maxHeight: '500px',
                            overflowY: 'auto',
                        }}>
                            {selectedLog.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'rgba(255,255,255,0.4)',
                                        marginBottom: '4px',
                                    }}>
                                        {msg.role === 'user' ? '👤 고객' : '🤖 AI'} · {formatDate(msg.timestamp)}
                                        {msg.language && ` · ${getLanguageName(msg.language)}`}
                                    </div>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: msg.role === 'user' ? '#8B5A2B' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        maxWidth: '90%',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
