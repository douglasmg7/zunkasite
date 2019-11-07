#!/usr/bin/env bash

[[ -z "$ZUNKA_SITE_PATH " ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 
[[ -z "$GS " ]] && printf "error: GS enviorment not defined.\n" >&2 && exit 1 
[[ -z "$ZUNKAPATH " ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH
echo :: Fetching zunka site...
git fetch
# Check if some style file was changed.
STYLE_FILES_CHANGED=`git diff --name-only master...origin/master | grep "*.styl"`
# Check if some file was changed.
FILES_CHANGED=`git diff --name-only master...origin/master
# Merge.
if [[ ! -z FILES_CHANGED ]]; then
    echo :: Merging zunka site...
    git merge
fi
# Compile style files.
if [[ ! -z STYLE_FILES_CHANGED ]]; then
    echo :: Compile style files...
    ./bin/compile_styl
fi
# Set zunka site to be restarted.
if [[ ! -z FILES_CHANGED ]]; then
    echo :: Setting zunka site to be restarted...
    echo true > ZUNKAPATH/restart-zunka-site

# Upgrade zunkasrv.
$GS/zunkasrv/bin/update-all.sh
