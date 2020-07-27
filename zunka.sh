# Golang tools (compiler).
export PATH=$PATH:/usr/local/go/bin

# Golang path.
export GOPATH=$HOME/code/golang
export PATH=$PATH:$GOPATH/bin

# Golang source is out gopath and using mod.
# export GS=$GOPATH/src/github.com/douglasmg7
export GS=/home/douglasmg7/code

# Rust bin path.
export PATH="$PATH:$HOME/.cargo/bin"

# Zunka.
export ZUNKAPATH=~/.local/share/zunka
# export ZUNKA_SITE_PATH=/home/douglasmg7/zunka
export ZUNKA_SITE_PATH=$GS/zunkasite
export ZUNKA_SRV_DB=zunkasrv.db
export ZUNKA_ALDOWSC_DB=aldowsc.db
export ZUNKA_FREIGHT_DB=freight.db
export ZUNKA_ALLNATIONS_DB=allnations.db
