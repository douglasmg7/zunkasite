#!/usr/bin/env node
'use strict';

// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }

// npm modules
const path = require('path');
const winston = require('winston');
const fs = require('fs');

// file to log.
const parsePath = path.parse(module.parent.filename);
const logDir = path.join(parsePath.dir, 'log');
const logFilename = path.join(logDir, (parsePath.name + '.log'));
// console.log(logDir);
// console.log(logFilename);

// create log dir
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
} catch (e) {
  console.log(e);
}

// Log configuration.
const log = winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'silly',
      prettyPrint: true,
      silent: false,
      colorize: true,
      timestamp: true,
      filename: logFilename,
      maxsize: 40000,
      maxFiles: 10,
      json: false
      // pid: 2323
    })
  ]
});

// No test mode.
if(process.env.NODE_ENV !== 'test'){
  log.add(new winston.transports.Console(),
    {
      level: 'silly',
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: false
    }
  );
}

// module.exports = module = log;
module.exports = log;
