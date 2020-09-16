'use strict';
const log = require('../config/log');

function check(envs) {
    envs.forEach(env=>{
        if (!process.env[env]) {
            log.error(`Environment variable ${env} not defined`);
            process.exit(1);
        } else {
            // log.debug(`Environment variable ${env}: ${process.env[env]}`);
        }
    });
}


module.exports.check = check;
