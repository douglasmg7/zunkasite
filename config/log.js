'use strict';

// npm modules
const path = require('path');
const { createLogger, format, transports, addColors } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const colors = require('colors/safe');

// ZUNKAPATH must be defined.
if (!process.env.ZUNKAPATH) {
    console.error(`ZUNKAPATH not defined.`);
    process.exit(1);
} 
const logDir = path.join(process.env.ZUNKAPATH, 'log', 'zunka-site');

// Custom levels.
const levels = {
    error: 0, 
    warn: 1, 
    info: 2, 
    debug: 3, 
    silly: 4,
};
// Level colors.
const levelColors = {
    error: 'red', 
    warn: 'yellow', 
    info: 'green', 
    debug: 'blue', 
    silly: 'white',
};

// Create log dir.
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
} catch (e) {
    console.log(e);
}

let fileTransportError = new transports.DailyRotateFile({
    filename: path.join(logDir, 'error-zunka-site-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxsize: '2m',
    maxFiles: '15d',
    level: 'error',
    format: format.combine(
        format.timestamp(),
        format.printf(info=>`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`)
        // format.printf(info=>colors[levelColors[info.level]](`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`))
    ),
})

let fileTransportDebug = new transports.DailyRotateFile({
    filename: path.join(logDir, 'debug-zunka-site-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxsize: '2m',
    maxFiles: '15d',
    level: 'debug',
    format: format.combine(
        format.timestamp(),
        format.printf(info=>`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`)
        // format.printf(info=>colors[levelColors[info.level]](`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`))
    ),
})

let fileTransportSilly = new transports.DailyRotateFile({
    filename: path.join(logDir, 'silly-zunka-site-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxsize: '2m',
    maxFiles: '15d',
    level: 'silly',
    format: format.combine(
        format.timestamp(),
        format.printf(info=>`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`)
        // format.printf(info=>colors[levelColors[info.level]](`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`))
    ),
})

// transport.on('rotate', function(oldFilename, newFilename) {
// // do something fun
// });

// Log configuration.
const log = createLogger({
    levels: levels,
    transports: [ fileTransportError, fileTransportDebug, fileTransportSilly ]
});

// // Log configuration.
// const log = createLogger({
// levels: levels,
// transports: [
// new transports.File({
// filename: logFilename,
// level: 'debug',
// format: format.combine(
// format.timestamp(),
// format.printf(info=>`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`)
// // format.printf(info=>colors[levelColors[info.level]](`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`))
// ),
// maxsize: 100 * 1000,
// maxFiles: 20,
// // pid: 2323
// })
// ]
// });

// Console only on dev.
if(process.env.NODE_ENV === 'development'){
    log.add(new transports.Console({
        level: 'debug',
        format: format.combine(
            format.label({ label: '[zunka]' }),
            format.printf(info=>colors[levelColors[info.level]](`${info.label} ${info.message}`)),
        )
    }));
}

// log.stream = { 
    // write: function(message, encoding){ 
        // log.info(message); 
    // } 
// }; 

module.exports = log;