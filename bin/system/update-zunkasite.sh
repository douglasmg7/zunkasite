#!/usr/bin/env bash

[[ -z $ZUNKA_SITE_PATH ]] && printf "error: ZUNKA_SITE_PATH enviorment not defined.\n" >&2 && exit 1 
[[ -z $GS ]] && printf "error: GS enviorment not defined.\n" >&2 && exit 1 
[[ -z $ZUNKAPATH ]] && printf "error: ZUNKAPATH enviorment not defined.\n" >&2 && exit 1 

cd $ZUNKA_SITE_PATH
echo :: Fetching zunka site...
git fetch

FILES_CHANGED=`git diff --name-only master...origin/master`
BUNDLE_FILES_CHANGED=`git diff --name-only master...origin/master | grep "\.bundle$"`
STYLE_FILES_CHANGED=`git diff --name-only master...origin/master | grep "\.styl$"`
# PACKAGE_JSON_FILE_CHANGED=`git diff --name-only master...origin/master | grep "package\.json$"`
PACKAGE_JSON_FILE_CHANGED=`git diff  master...origin/master package.json | grep "^\+\s" | grep -v version`
SECRET_FILES_CHANGED=`git diff --name-only master...origin/master | grep "\.secret$"`
RESTART_ZUNKA_SITE=`git diff --name-only master...origin/master | egrep \.'(json|secret|pug|js|styl|bundle)'$`
RELOAD_NGINX=`git diff --name-only master...origin/master | egrep '(nginx.conf.secret|zunka.conf.secret)'$`

# Merge.
if [[ ! -z $FILES_CHANGED ]]; then
    echo :: Merging zunka site...
    git merge
else
    printf "Already up to date.\n"
fi

# Npm install.
if [[ ! -z $PACKAGE_JSON_FILE_CHANGED ]]; then
    echo :: Updating npm packages...
    npm install
fi

# Compile bundle files.
if [[ ! -z $BUNDLE_FILES_CHANGED ]]; then
    echo :: Compiling bundle files...
    ./bin/compile-bundle.sh
fi

# Compile style files.
if [[ ! -z $STYLE_FILES_CHANGED ]]; then
    echo :: Compiling style files...
    ./bin/compile-styl.sh
fi

# Reveal secret files.
if [[ ! -z $SECRET_FILES_CHANGED ]]; then
    echo :: Revealing secret files...
    git secret reveal
fi

# Set zunka site to be restarted.
if [[ ! -z $RESTART_ZUNKA_SITE ]]; then
    echo :: Signaling to restart zunkasite...
    echo true > $ZUNKAPATH/restart-zunkasite
fi

# Reload nginx.
if [[ ! -z $RELOAD_NGINX ]]; then
    echo :: Signaling to reload nginx...
    echo true > $ZUNKAPATH/reload-nginx
fi
