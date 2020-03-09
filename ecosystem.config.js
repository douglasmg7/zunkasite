module.exports = {
    apps : [{
        name: 'zunkasite',
        script: './bin/www',
        watch: false,
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            DB: 'production'
        },
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_zunkasite.log',
        log: '/dev/null',
        // log_type: "json",
        // log: './log/pm2_combined.out_err.log',
    },
    {
        name: 'zunkasrv',
        script: 'zunkasrv',
        cwd: process.env.GS + '/zunkasrv',
        watch: false,
        env: {},
        env_production: {
            RUN_MODE: 'production'
        },
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_zunkasrv.log',
        log: '/dev/null',
    },
    {
        name: 'freightsrv',
        script: 'freightsrv',
        cwd: process.env.GS + '/freightsrv',
        watch: false,
        env: {},
        env_production: {
            RUN_MODE: 'production'
        },
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_freightsrv.log',
        log: '/dev/null',
    },
    {
        name: 'zoomproducts',
        script: 'zoomproducts',
        cwd: process.env.GS + '/zoomproducts',
        watch: false,
        env: {},
        env_production: {
            RUN_MODE: 'development'
        },
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_zoomproducts.log',
        log: '/dev/null',
    }]
};
