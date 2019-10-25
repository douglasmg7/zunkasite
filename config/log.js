'use strict';

// npm modules
const path = require('path');
const { createLogger, format, transports, addColors } = require('winston');
const fs = require('fs');
const colors = require('colors/safe');
// file to write logs.
// const parsePath = path.parse(module.parent.filename);
// const logDir = path.join(parsePath.dir, 'log');
// const logFilename = path.join(logDir, (parsePath.name + '.log'));

// ZUNKAPATH must be defined.
if (!process.env.ZUNKAPATH) {
    console.error(`ZUNKAPATH not defined.`);
    process.exit(1);
} 
const logDir = path.join(process.env.ZUNKAPATH, 'log');
const logFilename = path.join(logDir, 'zunkasite.log');
// console.log(logDir);
// console.log(logFilename);

// Custom levels.
const levels = {
    error: 0, 
    warn: 1, 
    info: 2, 
    debug: 3, 
};
// Level colors.
const levelColors = {
    error: 'red', 
    warn: 'yellow', 
    info: 'green', 
    debug: 'blue', 
};

// Create log dir.
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
} catch (e) {
  console.log(e);
}

// Log configuration.
const log = createLogger({
  levels: levels,
  transports: [
    new transports.File({
      filename: logFilename,
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.printf(info=>`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`)
        // format.printf(info=>colors[levelColors[info.level]](`${info.timestamp}  ${info.level.padEnd(5)}  ${info.message}`))
      ),
      maxsize: 100 * 1000,
      maxFiles: 20,
      // pid: 2323
    })
  ]
});

// Not run on test mode.
if(process.env.NODE_ENV !== 'test'){
  log.add(new transports.Console({
    level: 'debug',
    format: format.combine(
      format.label({ label: '[app]' }),
      format.printf(info=>colors[levelColors[info.level]](`${info.label} ${info.message}`)),
    )
  }));
}

module.exports = log;