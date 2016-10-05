#!/bin/bash

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# location of sql databases
ADDRESS_DB='/data/oa.db';
STREET_DB='/data/planet.db';

# location of stdio files
PROC_STDOUT='/data/conflate.out';
PROC_STDERR='/data/conflate.err';

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR='/data/tmp';

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir $SQLITE_TMPDIR;

# delete stdio files
rm $PROC_STDOUT $PROC_STDERR &>/dev/null;

# run import
$DIR/concat_oa.sh | time -p node $DIR/../cmd/oa.js $ADDRESS_DB $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR;
