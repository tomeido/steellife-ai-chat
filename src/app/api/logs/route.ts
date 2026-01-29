import { NextRequest, NextResponse } from "next/server";
import {
    ChatLog,
    getAllChatLogs,
    getChatLog,
    deleteChatLog,
    clearAllLogs
} from "@/lib/log-storage";

// Simple API key check for admin access
const ADMIN_API_KEY = process.env.LOGS_API_KEY || "steellife-admin-2026";

function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return false;

    const [type, key] = authHeader.split(" ");
    return type === "Bearer" && key === ADMIN_API_KEY;
}

// GET /api/logs - Retrieve all chat logs
// GET /api/logs?sessionId=xxx - Retrieve specific session log
export async function GET(request: NextRequest) {
    // Check authorization for production (skip for same-site requests from /logs page)
    const referer = request.headers.get("referer") || "";
    const isSameSiteRequest = referer.includes("/logs");

    if (process.env.NODE_ENV === "production" && !isSameSiteRequest && !isAuthorized(request)) {
        return NextResponse.json(
            { error: "Unauthorized. Provide valid API key in Authorization header." },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
        // Return specific session log
        const log = await getChatLog(sessionId);
        if (!log) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(log);
    }

    // Return all logs
    const allLogs = await getAllChatLogs();

    return NextResponse.json({
        total: allLogs.length,
        logs: allLogs
    });
}

// GET summary statistics
export async function POST(request: NextRequest) {
    // Check authorization (skip for same-site requests from /logs page)
    const referer = request.headers.get("referer") || "";
    const isSameSiteRequest = referer.includes("/logs");

    if (process.env.NODE_ENV === "production" && !isSameSiteRequest && !isAuthorized(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const allLogs = await getAllChatLogs();

    // Calculate statistics
    const stats = {
        totalSessions: allLogs.length,
        totalMessages: allLogs.reduce((acc: number, log: ChatLog) => acc + log.messages.length, 0),
        languageBreakdown: {} as Record<string, number>,
        recentSessions: allLogs.slice(0, 10).map((log: ChatLog) => ({
            sessionId: log.sessionId,
            startTime: log.startTime,
            messageCount: log.messages.length,
            lastMessage: log.messages[log.messages.length - 1]?.content.substring(0, 100) || ""
        }))
    };

    // Count by language
    allLogs.forEach((log: ChatLog) => {
        log.messages
            .filter((m: { role: string; language?: string }) => m.role === "user" && m.language)
            .forEach((m: { role: string; language?: string }) => {
                const lang = m.language || "unknown";
                stats.languageBreakdown[lang] = (stats.languageBreakdown[lang] || 0) + 1;
            });
    });

    return NextResponse.json(stats);
}

// DELETE /api/logs?sessionId=xxx - Clear specific session
// DELETE /api/logs - Clear all logs
export async function DELETE(request: NextRequest) {
    // Check authorization
    if (!isAuthorized(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
        const deleted = await deleteChatLog(sessionId);
        if (deleted) {
            return NextResponse.json({ message: `Session ${sessionId} deleted` });
        }
        return NextResponse.json(
            { error: "Session not found" },
            { status: 404 }
        );
    }

    // Clear all logs
    await clearAllLogs();
    return NextResponse.json({ message: "All logs cleared" });
}
