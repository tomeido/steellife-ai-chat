import { kv } from "@vercel/kv";

export interface ChatLog {
    sessionId: string;
    startTime: string;
    messages: {
        timestamp: string;
        role: string;
        content: string;
        language?: string;
    }[];
}

const LOGS_KEY_PREFIX = "chat:log:";
const LOGS_INDEX_KEY = "chat:logs:index";

// In-memory fallback for development without KV configured
const localLogs: Map<string, ChatLog> = new Map();

function isKVConfigured(): boolean {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Save or update a chat log
 */
export async function saveChatLog(log: ChatLog): Promise<void> {
    if (!isKVConfigured()) {
        // Fallback to in-memory for local development
        localLogs.set(log.sessionId, log);
        return;
    }

    try {
        // Save the log
        await kv.set(`${LOGS_KEY_PREFIX}${log.sessionId}`, log);

        // Add to index if new
        const index = await kv.smembers<string[]>(LOGS_INDEX_KEY) || [];
        if (!index.includes(log.sessionId)) {
            await kv.sadd(LOGS_INDEX_KEY, log.sessionId);
        }
    } catch (error) {
        console.error("Failed to save chat log to KV:", error);
        // Fallback to in-memory
        localLogs.set(log.sessionId, log);
    }
}

/**
 * Get a specific chat log by session ID
 */
export async function getChatLog(sessionId: string): Promise<ChatLog | null> {
    if (!isKVConfigured()) {
        return localLogs.get(sessionId) || null;
    }

    try {
        return await kv.get<ChatLog>(`${LOGS_KEY_PREFIX}${sessionId}`);
    } catch (error) {
        console.error("Failed to get chat log from KV:", error);
        return localLogs.get(sessionId) || null;
    }
}

/**
 * Get all chat logs
 */
export async function getAllChatLogs(): Promise<ChatLog[]> {
    if (!isKVConfigured()) {
        return Array.from(localLogs.values());
    }

    try {
        const index = await kv.smembers<string[]>(LOGS_INDEX_KEY) || [];

        if (index.length === 0) {
            return [];
        }

        // Fetch all logs in parallel
        const logs = await Promise.all(
            index.map(sessionId => kv.get<ChatLog>(`${LOGS_KEY_PREFIX}${sessionId}`))
        );

        // Filter out nulls and sort by startTime (newest first)
        return logs
            .filter((log): log is ChatLog => log !== null)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch (error) {
        console.error("Failed to get all chat logs from KV:", error);
        return Array.from(localLogs.values());
    }
}

/**
 * Delete a specific chat log
 */
export async function deleteChatLog(sessionId: string): Promise<boolean> {
    if (!isKVConfigured()) {
        return localLogs.delete(sessionId);
    }

    try {
        await kv.del(`${LOGS_KEY_PREFIX}${sessionId}`);
        await kv.srem(LOGS_INDEX_KEY, sessionId);
        return true;
    } catch (error) {
        console.error("Failed to delete chat log from KV:", error);
        return false;
    }
}

/**
 * Clear all chat logs
 */
export async function clearAllLogs(): Promise<void> {
    if (!isKVConfigured()) {
        localLogs.clear();
        return;
    }

    try {
        const index = await kv.smembers<string[]>(LOGS_INDEX_KEY) || [];

        // Delete all logs
        await Promise.all(
            index.map(sessionId => kv.del(`${LOGS_KEY_PREFIX}${sessionId}`))
        );

        // Clear the index
        await kv.del(LOGS_INDEX_KEY);
    } catch (error) {
        console.error("Failed to clear all chat logs from KV:", error);
        localLogs.clear();
    }
}

/**
 * Check if a session exists
 */
export async function hasSession(sessionId: string): Promise<boolean> {
    if (!isKVConfigured()) {
        return localLogs.has(sessionId);
    }

    try {
        const log = await kv.get(`${LOGS_KEY_PREFIX}${sessionId}`);
        return log !== null;
    } catch (error) {
        console.error("Failed to check session from KV:", error);
        return localLogs.has(sessionId);
    }
}
