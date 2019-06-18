#!/usr/bin/env bash

printf "Get only today exported data\n"
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/2018-Nov-27@18:49:28.gz .

# Get image backup.
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/img-2019-Jun-18@*.gz .
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/img-$(date +%Y-%h-%d)@*.gz .

# Get db backup.
# scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/db-2019-Jun-18@*.gz .
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/dump/db-$(date +%Y-%h-%d)@*.gz .
