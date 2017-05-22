#!/usr/bin/env node
'use strict';

let timer = {
  begin (label) {
    this[label] = process.hrtime();
  },
  // n - nanoseconds
  // m - miliseconds
  // s - seconds
  end (label, option) {
    if (this[label]) {
      // Get elapsed time.
      let elapsedTime = process.hrtime(this[label]);
      // Elapsed time in nanoseconds.
      let elapsedTimeNs = elapsedTime[0] * 1e9 + elapsedTime[1];
      delete this[label];
      switch (option) {
        case 'n':
          return elapsedTimeNs + 'ns';
        case 'm':
          return Math.round(elapsedTimeNs / 1e6) + 'ms';
        case 's':
          return Math.round(elapsedTimeNs / 1e9) + 's';
        default:
          return Math.round(elapsedTimeNs / 1e6) + 'ms';
      }
    }
    // No timer started to specific label.
    else {
      return (`timer ${label} not started`);
    }
  }
};
module.exports = timer;
