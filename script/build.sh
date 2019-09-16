#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# build a fresh version of the database files

# note: exporting this parameters will override the behaviour of child scripts.
# you should only have to modify these params for your specific setup.
# see the individual script for more options (only the important ones are listed here).

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

export TIMESTAMP=$(date +"%m-%d-%Y-%H:%M:%S");
export PBF2JSON_BIN="${PBF2JSON_BIN:-"$DIR/../node_modules/pbf2json/build/pbf2json.linux-x64"}";

# location of data files
export WORKINGDIR="${WORKINGDIR:-"/mnt/pelias"}";
# the file containing all the streets
export POLYLINE_FILE="${POLYLINE_FILE:-"$WORKINGDIR/data/polylines/planet.polylines"}";
# base path of openaddresses file system
export OAPATH="${OAPATH:-"$WORKINGDIR/data/oa"}";
 # base path of osm pbf file
export PBF2JSON_FILE="${PBF2JSON_FILE:-"$WORKINGDIR/data/osm/planet-latest.osm.pbf"}";

# a directory where all builds will live
BUILDS="$WORKINGDIR/interpolation/builds";

# ensure builds dir exists
[ -d $BUILDS ] || mkdir -p $BUILDS;

# a directory where this specific build will live
export BUILDDIR="${BUILDDIR:-"$BUILDS/$TIMESTAMP"}";
[ -d $BUILDDIR ] || mkdir -p $BUILDDIR;

# location of temp files
export SQLITE_TMPDIR="$BUILDDIR/tmp"; # a directory with enough free space to store sqlite tmp files
export PBF2JSON_TMPDIR="$BUILDDIR/tmp/leveldb"; # a directory with enough free space to store leveldb tmp files

# run polyline importer
echo "- importing polylines"
$DIR/import.sh;

# archive street database (using parallel gzip when available)
echo "- archiving street database"
if type pigz >/dev/null
  then pigz -k -c --best "$BUILDDIR/street.db" > "$BUILDDIR/street.db.gz";
  else gzip -c --best "$BUILDDIR/street.db" > "$BUILDDIR/street.db.gz";
fi

# run openaddresses conflation
echo "- conflating openaddresses"
$DIR/conflate_oa.sh;

# run openstreetmap conflation
echo "- conflating openstreetmap"
$DIR/conflate_osm.sh;

# run tiger conflation
echo "- conflating tiger"
$DIR/conflate_tiger.sh;

# run vertex interpolation
echo "- interpolating vertices"
$DIR/vertices.sh;

# archive address database (using parallel gzip when available)
echo "- archiving address database"

if type pigz >/dev/null
  then pigz -k -c --best "$BUILDDIR/address.db" > "$BUILDDIR/address.db.gz";
  else gzip -c --best "$BUILDDIR/address.db" > "$BUILDDIR/address.db.gz";
fi

# clean up
rm -rf "$SQLITE_TMPDIR" "$PBF2JSON_TMPDIR"; # remove tmp files

# record build meta data
METAFILE="$BUILDDIR/build.meta";

echo "- generating meta file"

echo "-- file system --" > "$METAFILE";
ls -lah "$BUILDDIR" >> "$METAFILE";
shasum $BUILDDIR/*.db* >> "$METAFILE";

echo "-- street db --" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/street.db" "SELECT * FROM sqlite_master;" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/street.db" "SELECT COUNT(*) FROM rtree;" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/street.db" "SELECT COUNT(*) FROM polyline;" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/street.db" "SELECT COUNT(*) FROM names;" >> "$METAFILE";

echo "-- address db --" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/address.db" "SELECT * FROM sqlite_master;" >> "$METAFILE";
sqlite3 -echo "$BUILDDIR/address.db" "SELECT COUNT(*) FROM address;" >> "$METAFILE";

# update 'current' symlink
ln -sfn "$BUILDDIR" "$BUILDS/current";

echo
echo "Build completed!"
echo
