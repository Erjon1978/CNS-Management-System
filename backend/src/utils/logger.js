const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Configure winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // File transport - all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport - error logs only
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Create a stream object for Morgan middleware
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Custom log methods
const log = {
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },
    verbose: (message, meta = {}) => {
        logger.verbose(message, meta);
    },
    silly: (message, meta = {}) => {
        logger.silly(message, meta);
    },
    // Log API requests
    api: (req, res, responseTime) => {
        const meta = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user.id : 'anonymous'
        };
        logger.info(`API Request: ${req.method} ${req.url}`, meta);
    },
    // Log database operations
    db: (operation, collection, query, duration) => {
        logger.debug(`DB Operation: ${operation} on ${collection}`, {
            operation,
            collection,
            query: JSON.stringify(query),
            duration: `${duration}ms`
        });
    },
    // Log authentication events
    auth: (event, userId, meta = {}) => {
        logger.info(`Auth: ${event}`, {
            event,
            userId,
            ...meta
        });
    },
    // Log system events
    system: (event, systemId, meta = {}) => {
        logger.info(`System: ${event}`, {
            event,
            systemId,
            ...meta
        });
    },
    // Log task events
    task: (event, taskId, meta = {}) => {
        logger.info(`Task: ${event}`, {
            event,
            taskId,
            ...meta
        });
    },
    // Log incident events
    incident: (event, incidentId, meta = {}) => {
        logger.info(`Incident: ${event}`, {
            event,
            incidentId,
            ...meta
        });
    }
};

module.exports = log;