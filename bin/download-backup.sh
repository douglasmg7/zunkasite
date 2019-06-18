#!/usr/bin/env bash

# Go to script dir.
cd $(dirname $0)

printf "Get only data exported today.\n"
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/2018-Nov-27@18:49:28.gz .

# Get images backup.
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/img-$(date +%Y-%h-%d).tar.gz ../dump/

# Get mongo backup.
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/db-$(date +%Y-%h-%d).gz ../dump/

# Get redis backup.
scp root@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/dump-$(date +%Y-%h-%d).rdb ../dump/
