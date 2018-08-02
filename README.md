# Zunka server

### Install dependencies
```bash
$ cd zunka
$ npm install
$ sudo npm i pm2 -g
```
### Running server
Development mode.
```bash
$ npm run dev
```

Production mode.
```bash
$ npm start
```

### Stopping server
Development mode.
``` bash
$ <ctrl+c>
```
Production mode.
```bash
$ npm stop
```

### Restarting server on production mode
```bash
$ npm restrart
```

### Enable/disable pm2 startup hook (add/remove a systemd entry)
So pm2 can startup the pocess list.
Add a startup hook.
```bash
$ pm2 startup   
```
Remove a startup hook.
```bash
$ pm2 unstart
```

### Saving/removing pm2 process list (production mode)
So it restart the server on startup system.
Server must been running before execute the command.
```bash
$ pm2 save
```
Disable server from start on system start.
```bash
$ pm2 cleardump
```






