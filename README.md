# Zunka server

### Install dependencies
```bash
$ cd zunka
$ npm install
$ sudo npm i pm2 -g
```
### Run server in development mode
```bash
$ npm run dev
```

### Stop server running in development mode.
``` bash
$ <ctrl+c>
```

### Automatically start pm2 (create a systemd entry)
```bash
$ pm2 startup   
```

### Run server in production mode
```bash
$ npm start
```

### Save pm2 process list, so it restart the server on startup system
```bash
$ pm2 save
```

### Restart server on production mode
```bash
$ npm restrart
```

### Stop server in production mode 
```bash
$ npm stop
```

### Disable server from start on system start (production mode)
```bash
$ pm2 cleardump
```

### Disable pm2 start on system startup (Remove systemd entry)
```bash
$ pm2 unstart
```




