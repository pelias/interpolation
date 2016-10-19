#!/bin/bash
set -e;

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# location of input polyline file
POLYLINE_FILE='/data/polyline/planet.polylines';

# location of sql databases
STREET_DB='/data/street.db';

# location of archives
ARCHIVE_DIR=$(dirname "$STREET_DB");
ARCHIVE_BASE=$(basename "$STREET_DB");
TIMESTAMP=$(date +"%m-%d-%Y-%H:%M:%S");
ARCHIVE_NAME="$ARCHIVE_DIR/$ARCHIVE_BASE.$TIMESTAMP.gz";

# location of stdio files
PROC_STDOUT='/data/polyline.out';
PROC_STDERR='/data/polyline.err';

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR='/data/tmp';

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir $SQLITE_TMPDIR;

# delete stdio files
rm -f $PROC_STDOUT $PROC_STDERR;

# run import
cat $POLYLINE_FILE | time -p node $DIR/../cmd/polyline.js $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR;

# archive street database
pigz -k -c --best $STREET_DB > $ARCHIVE_NAME;
