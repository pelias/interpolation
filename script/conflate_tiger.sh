#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# import tiger data and conflate it with $STREET_DB

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

# ---- dependencies ----

# ensure unzip exists and is executable
UNZIP_PATH=$(which unzip)
if [[ ! -f "$UNZIP_PATH" || ! -x "$UNZIP_PATH" ]]; then
  echo "unzip not found or is not executable";
  exit 1;
fi

# ensure ogr2ogr exists and is executable
OGR2OGR_PATH=$(which ogr2ogr)
if [[ ! -f "$OGR2OGR_PATH" || ! -x "$OGR2OGR_PATH" ]]; then
  echo "ogr2ogr not found or is not executable";
  exit 1;
fi

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
PROC_STDOUT=${PROC_STDOUT:-"$BUILDDIR/conflate_tiger.out"};
PROC_STDERR=${PROC_STDERR:-"$BUILDDIR/conflate_tiger.err"};

# a directory with enough free space to store sqlite tmp files
export SQLITE_TMPDIR=${SQLITE_TMPDIR:-"$BUILDDIR/tmp"};

# ensure tmpdir exists
[ -d $SQLITE_TMPDIR ] || mkdir -p $SQLITE_TMPDIR;

# delete previous stdio files
rm -f $PROC_STDOUT $PROC_STDERR $PROC_CONFERR;

# download path of tiger files (use default unless param is supplied)
TIGERPATH=${TIGERPATH:-"$WORKINGDIR/data/tiger"};
# ensure shapefiles directory exists
[ -d "$TIGERPATH/shapefiles" ] || mkdir -p "$TIGERPATH/shapefiles";

# recurse through filesystem listing all .shx file names
# some county zip packages are missing .shx which causes the ogr2ogr script to fail
find "$TIGERPATH/shapefiles" -type f -iname "*.shx" -print0 |\
  while IFS= read -r -d $'\0' filename; do

    # echo filename to stderr
    >&2 echo $(date -u) "$filename";

    ogr2ogr -f GeoJSON -t_srs crs:84 /vsistdout/ "$filename" |\
      node --max-old-space-size=8192 $DIR/../cmd/tiger.js $ADDRESS_DB $STREET_DB 1>>$PROC_STDOUT 2>>$PROC_STDERR;

  done;
