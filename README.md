# Zunka system

## Install
$ cd zunka
$ npm install
$ sudo npm i pm2 -g

## Run into dev mode
$ npm run dev

## Stop server on dev mode.
$ <ctrl+c>

## Run server on production mode and config to restart on system startup
### Automatically start pm2 (create a systemd entry)
$ pm2 startup   
### Start server
$ npm start
### Save pm2 process list, so it restart the server on startup system
$ pm2 save

### Restart server on production mode
$ npm restrart

## Stop server in production mode and disable startup and pm2 startup
### Stop server in production mode 
$ npm stop
### Disable server startup on system start
$ pm2 cleardump
### Disable pm2 startup on system startup (Remove systemd entry)
$ pm2 unstart




