#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# build directory
export BUILDDIR="/tmp/tigertmp";
export TIGERPATH="$BUILDDIR";
rm -rf "$BUILDDIR";
mkdir -p "$BUILDDIR/shapefiles";

# street db to use (update this to represent your local filesystem)
export STREET_DB="/data/builds/street.db";

# shapefile to use (update this to represent your local filesystem)
TIGER="/data/tiger/shapefiles/tl_2016_30059_addrfeat.*";
cp $TIGER "$BUILDDIR/shapefiles";

# run
/bin/bash $DIR/../script/conflate_tiger.sh;

# debug
ls -lah "$BUILDDIR";
ls -lah "$BUILDDIR/shapefiles";

# server
/bin/bash $DIR/../interpolate server "$BUILDDIR/address.db" "$STREET_DB";
