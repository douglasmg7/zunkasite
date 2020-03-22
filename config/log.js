'use strict';

// npm modules
const path = require('path');
const { createLogger, format, transports, addColors } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const colors = require('colors/safe');
const moment = require('moment-timezone');

// ZUNKAPATH must be defined.
if (!process.env.ZUNKAPATH) {
    console.error(`ZUNKAPATH not defined.`);
    process.exit(1);
} 
const logDir = path.join(process.env.ZUNKAPATH, 'log', 'zunkasite');

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

// console.log(`time: ${ moment().tz('America/Sao_Paulo').format() }`);

// General configurations.
let datePattern = 'YYYY-MM-DD';
let maxSize = '2m';
let maxFiles = '15d';
let _format = format.combine(
    format.timestamp({'format': () => { return moment().tz('America/Sao_Paulo').format() } }),
    format.printf(info=>`${info.timestamp}  ${info.level.padEnd(6)}  ${info.message}`)
);

// Error log.
let fileTransportError = new transports.DailyRotateFile({
    filename: path.join(logDir, 'error-zunkasite-%DATE%.log'),
    datePattern: datePattern,
    maxSize: maxSize,
    maxFiles: maxFiles,
    level: 'error',
    format: _format
}) 
// Debug log.
let fileTransportDebug = new transports.DailyRotateFile({
    filename: path.join(logDir, 'debug-zunkasite-%DATE%.log'),
    datePattern: datePattern,
    maxSize: maxSize,
    maxFiles: maxFiles,
    level: 'debug',
    format: _format
}) 
// Silly log.
let fileTransportSilly = new transports.DailyRotateFile({
    filename: path.join(logDir, 'silly-zunkasite-%DATE%.log'),
    datePattern: datePattern,
    maxSize: maxSize,
    maxFiles: maxFiles,
    level: 'silly',
    format: format.combine(
        format.timestamp({'format': () => { return moment().tz('America/Sao_Paulo').format() } }),
        format.ms(),
        format.printf(info=>`${info.timestamp}  ${info.ms.padEnd(6)}  ${info.level.padEnd(6)}  ${info.message}`)
    )
}) 

// Log configuration.
const log = createLogger({
    levels: levels,
    transports: [ fileTransportError, fileTransportDebug, fileTransportSilly ]
});

// Console (dev).
// if(process.env.NODE_ENV === 'development'){
// if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'){
if(process.env.NODE_ENV === 'development'){
    log.add(new transports.Console({
        level: 'debug',
        format: format.combine(
            format.timestamp({'format': () => { return moment().tz('America/Sao_Paulo').format() } }),
            format.label({ label: '[zunka]' }),
            format.printf(info=>colors[levelColors[info.level]](`${info.label}  ${info.message}`)),
        )
    }));
}

module.exports = log;