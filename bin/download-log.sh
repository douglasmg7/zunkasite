#!/usr/bin/env bash
cd $(dirname $0)

# which log.
read -p "Qual lof file to download: " LOG_FILE

# Get images backup.
scp douglasmg7@vps10092.publiccloud.com.br:/home/douglasmg7/zunka/log/$LOG_FILE ../dump/
