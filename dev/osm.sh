#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# import osm data directly from PBF file

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );

ADDRESS_DB="/tmp/addr.db";
STREET_DB="/data/street.db";

# location of pbf2json binary
# download from: https://github.com/pelias/pbf2json
PBF2JSON="/var/www/pelias/pbf2json/build/pbf2json.linux-x64";

# PBF extract
PBFFILE="/data/extract/greater-london-latest.osm.pbf";

# clean up
rm -rf $ADDRESS_DB;

# run import
$PBF2JSON -tags="addr:housenumber+addr:street" $PBFFILE | $DIR/../interpolate osm $ADDRESS_DB $STREET_DB;
