#!/bin/bash

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# location of input polyline file
POLYLINE_FILE='/data/polyline/planet.polylines';

# location of sql databases
STREET_DB='/data/planet.db';

# location of stdio files
PROC_STDOUT='/data/polyline.out';
PROC_STDERR='/data/polyline.err';

# a directory with enough free space to store sqlite tmp files
SQLITE_TMPDIR='/data/tmp';

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir $SQLITE_TMPDIR;

# delete stdio files
rm $PROC_STDOUT $PROC_STDERR &>/dev/null;

# run import
cat $POLYLINE_FILE | time -p SQLITE_TMPDIR=$SQLITE_TMPDIR node $DIR/../cmd/polyline.js $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR;
