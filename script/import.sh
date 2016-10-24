#!/bin/bash
set -e;

# import polyline data

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# location where this build will be stored
BUILDDIR=${BUILDDIR:-"/data"};
if [ ! -d $BUILDDIR ]; then
  echo "data dir does not exist";
  exit 1;
fi

# location of input polyline file
POLYLINE_FILE=${POLYLINE_FILE:-"$BUILDDIR/polyline/planet.polylines"};
if [ ! -f $POLYLINE_FILE ]; then
  echo "poyline line not found";
  exit 1
fi

# location of sql databases
STREET_DB=${STREET_DB:-"$BUILDDIR/street.db"};

# location of archives
ARCHIVE_DIR=$(dirname "$STREET_DB");
ARCHIVE_BASE=$(basename "$STREET_DB");
TIMESTAMP=${TIMESTAMP:-$(date +"%m-%d-%Y-%H:%M:%S")};
ARCHIVE_NAME="$ARCHIVE_DIR/$ARCHIVE_BASE.$TIMESTAMP.gz";

# location of stdio files
PROC_STDOUT=${PROC_STDOUT:-"$BUILDDIR/polyline.out"};
PROC_STDERR=${PROC_STDERR:-"$BUILDDIR/polyline.err"};

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR=${SQLITE_TMPDIR:-"$BUILDDIR/tmp"};

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir $SQLITE_TMPDIR;

# delete previous stdio files
rm -f $PROC_STDOUT $PROC_STDERR;

# run import
cat $POLYLINE_FILE | time -p node $DIR/../cmd/polyline.js $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR;

# archive street database (using parallel gzip when available)
if type pigz >/dev/null
  then pigz -k -c --best $STREET_DB > $ARCHIVE_NAME;
  else gzip -c --best $STREET_DB > $ARCHIVE_NAME;
fi
