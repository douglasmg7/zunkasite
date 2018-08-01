module.exports = {
  apps : [{
    name: 'zunka_server',
    interpreter: "/usr/bin/node",
    script: './bin/www',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    output: '/dev/null',
    error: './log/pm2.log',
    log: '/dev/null',
    log_type: "json",
    // log: './log/pm2_combined.out_err.log',
  }],
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
