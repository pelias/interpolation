#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# import openstreetmap data and conflate it with $STREET_DB

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# ---- pbf2json ----

# location of pbf2json binary
PBF2JSON_BIN=${PBF2JSON_BIN:-"$DIR/../node_modules/pbf2json/build/pbf2json.linux-x64"};

# ensure pbf2json exists and is executable
if [[ ! -f $PBF2JSON_BIN || ! -x $PBF2JSON_BIN ]]; then
  echo "pbf2json not found or is not executable";
  exit 1;
fi

# tags to target from the PBF extract
PBF2JSON_TAGS=${PBF2JSON_TAGS:-"addr:housenumber+addr:street"};

# full path to the .osm.pbf file we would like to import
PBF2JSON_FILE=${PBF2JSON_FILE:-"planet.osm.pbf"};

# a directory with enough free space to store leveldb tmp files
PBF2JSON_TMPDIR=${PBF2JSON_TMPDIR:-"$BUILDDIR/tmp/leveldb"};

# ensure tmpdir exists
[ -d $PBF2JSON_TMPDIR ] || mkdir -p $PBF2JSON_TMPDIR;

# ---- -------- ----

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
PROC_STDOUT=${PROC_STDOUT:-"$BUILDDIR/conflate_osm.out"};
PROC_STDERR=${PROC_STDERR:-"$BUILDDIR/conflate_osm.err"};

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR=${SQLITE_TMPDIR:-"$BUILDDIR/tmp"};

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir -p $SQLITE_TMPDIR;

# delete previous stdio files
rm -f $PROC_STDOUT $PROC_STDERR $PROC_CONFERR;

# run import
$PBF2JSON_BIN -tags="$PBF2JSON_TAGS" -leveldb="$PBF2JSON_TMPDIR" $PBF2JSON_FILE |\
 time -p node $DIR/../cmd/osm.js $ADDRESS_DB $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR;
