export type LastErrorEntry = {
    message: string;
    stack?: string;
    name?: string;
    route?: string;
    data?: unknown;
    timestamp: string;
};

let lastError: LastErrorEntry | null = null;

export function setLastError(entry: Omit<LastErrorEntry, 'timestamp'>) {
    lastError = { ...entry, timestamp: new Date().toISOString() };
}

export function getLastError(): LastErrorEntry | null {
    return lastError;
}


