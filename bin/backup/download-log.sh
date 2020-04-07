#!/usr/bin/env bash
cd $(dirname $0)

# Clean.
rm -rf ../dump/downloaded-logs
mkdir -p ../dump/downloaded-logs/nginx

# Get system logs from server.
scp -r douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/.local/share/zunka/log ../dump/downloaded-logs

# Get nginx logs from server.
scp -r root@vps10092.publiccloud.com.br:/var/log/nginx ../dump/downloaded-logs

# Backup logs.
tar -zcvf ../dump/downloaded-logs-$(date +%Y-%h-%dT%H%M%S).tar.gz ../dump/downloaded-logs/
