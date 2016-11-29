#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# import openaddresses data and conflate it with $STREET_DB

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# location where this build will be stored
BUILDDIR=${BUILDDIR:-"/data"};
if [ ! -d $BUILDDIR ]; then
  echo "data dir does not exist";
  exit 1;
fi

# location of sql databases
ADDRESS_DB=${ADDRESS_DB:-"$BUILDDIR/address.db"};
STREET_DB=${STREET_DB:-"$BUILDDIR/street.db"};

# location of stdio files
PROC_STDOUT=${PROC_STDOUT:-"$BUILDDIR/conflate_oa.out"};
PROC_STDERR=${PROC_STDERR:-"$BUILDDIR/conflate_oa.err"};
PROC_CONFERR=${PROC_CONFERR:-"$BUILDDIR/conflate_oa.skip"};

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR=${SQLITE_TMPDIR:-"$BUILDDIR/tmp"};

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir -p $SQLITE_TMPDIR;

# delete previous stdio files
rm -f $PROC_STDOUT $PROC_STDERR $PROC_CONFERR;

# run import
$DIR/concat_oa.sh | time -p node $DIR/../cmd/oa.js $ADDRESS_DB $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR 3>$PROC_CONFERR;
