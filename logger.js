const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logsDirectory = path.join(__dirname, 'log');

// Crea el directorio de logs si no existe
if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory);
}

const eventLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logsDirectory, 'eventLogger.log') })
    ]
});

const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logsDirectory, 'errorLogger.log') })
    ]
});

module.exports = { eventLogger, errorLogger };
