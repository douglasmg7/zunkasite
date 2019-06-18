#!/usr/bin/env bash

# Go to script dir.
cd $(dirname $0)

printf "Get only data exported today.\n"
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/2018-Nov-27@18:49:28.gz .

# Get image backup.
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/img-2019-Jun-18@*.gz .
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/img-$(date +%Y-%h-%d).tar.gz ../dump/

# Get db backup.
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/db-2019-Jun-18@*.gz .
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/db-$(date +%Y-%h-%d).gz ../dump/
