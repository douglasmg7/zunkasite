#!/usr/bin/env bash

# Change to script directory.
cd $(dirname "$0")/../scripts

# Create js files from bundle files from root script folder.
FILES=`find *\.bundle -maxdepth 0 -type f 2> /dev/null`
if [[ $? == 0 ]]; then
    for FILE in $FILES; do
        BUNDLE_FILE=./${FILE}
        JS_FILE="../dist/js/${FILE/\.bundle/\.js}"
        rollup $BUNDLE_FILE --file $JS_FILE --no-treeshake --format cjs
    done
fi

# Create destination folders if not exist.
DIRS=`ls -d */`
for DIR in $DIRS; do
    mkdir -p ../dist/js/$DIR
done

# Create js files from bundle files.
FILES=`find */*.bundle -type f`
for FILE in $FILES; do
    BUNDLE_FILE=./${FILE}
    JS_FILE="../dist/js/${FILE/\.bundle/\.js}"
    rollup $BUNDLE_FILE --file $JS_FILE --no-treeshake --format cjs
done
# rollup banner.bundle --file banner.js --no-treeshake --format cjs
