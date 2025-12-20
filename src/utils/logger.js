/**
 * Logger utility for structured error logging and telemetry
 * Provides consistent error tracking across the application
 */

const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

// Store recent logs for debugging (in-memory, limited size)
const logBuffer = [];
const MAX_LOG_BUFFER = 100;

const addToBuffer = (logEntry) => {
    logBuffer.push(logEntry);
    if (logBuffer.length > MAX_LOG_BUFFER) {
        logBuffer.shift();
    }
};

/**
 * Create a structured log entry
 */
const createLogEntry = (level, message, context = {}) => ({
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
});

/**
 * Log an error with context
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or additional context
 * @param {Object} context - Additional context (component, action, etc.)
 */
export const logError = (message, error = null, context = {}) => {
    const logEntry = createLogEntry(LOG_LEVELS.ERROR, message, {
        ...context,
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error
    });

    addToBuffer(logEntry);
    console.error(`[${logEntry.timestamp}] ERROR: ${message}`, logEntry.context);

    // In production, you would send this to a logging service
    // Example: sendToLoggingService(logEntry);
};

/**
 * Log a warning with context
 */
export const logWarn = (message, context = {}) => {
    const logEntry = createLogEntry(LOG_LEVELS.WARN, message, context);
    addToBuffer(logEntry);
    console.warn(`[${logEntry.timestamp}] WARN: ${message}`, context);
};

/**
 * Log info with context
 */
export const logInfo = (message, context = {}) => {
    const logEntry = createLogEntry(LOG_LEVELS.INFO, message, context);
    addToBuffer(logEntry);
    console.info(`[${logEntry.timestamp}] INFO: ${message}`, context);
};

/**
 * Log debug info (only in development)
 */
export const logDebug = (message, context = {}) => {
    if (import.meta.env.DEV) {
        const logEntry = createLogEntry(LOG_LEVELS.DEBUG, message, context);
        addToBuffer(logEntry);
        console.debug(`[${logEntry.timestamp}] DEBUG: ${message}`, context);
    }
};

/**
 * Get recent logs for debugging
 */
export const getRecentLogs = () => [...logBuffer];

/**
 * Clear log buffer
 */
export const clearLogs = () => {
    logBuffer.length = 0;
};

/**
 * Track an operation with timing
 * @param {string} operationName - Name of the operation
 * @param {Function} operation - Async function to execute
 * @returns {Promise<any>} - Result of the operation
 */
export const trackOperation = async (operationName, operation, context = {}) => {
    const startTime = performance.now();

    try {
        logDebug(`Starting: ${operationName}`, context);
        const result = await operation();
        const duration = Math.round(performance.now() - startTime);
        logInfo(`Completed: ${operationName}`, { ...context, durationMs: duration });
        return result;
    } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        logError(`Failed: ${operationName}`, error, { ...context, durationMs: duration });
        throw error;
    }
};

export default {
    error: logError,
    warn: logWarn,
    info: logInfo,
    debug: logDebug,
    getRecentLogs,
    clearLogs,
    trackOperation
};
