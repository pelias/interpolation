#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
STREETDB="$DIR/street.db";
ADDRESSDB="$DIR/address.db";
POLYLINES="$DIR/glasgow_street.polylines";
OPENADDRESSES="$DIR/oa_nz_glasgow_streets.csv";

# clean up old db files
rm -f $STREETDB $ADDRESSDB;

# log files
POLYLINE_OUT="$DIR/polyline.out";
POLYLINE_ERR="$DIR/polyline.err";
OA_OUT="$DIR/oa.out";
OA_ERR="$DIR/oa.err";
OA_SKIP="$DIR/oa.skip";

# clean up old log files
rm -f $POLYLINE_OUT $POLYLINE_ERR $OA_OUT $OA_ERR $OA_SKIP;

echo "-- run import --";
cat $POLYLINES | time -p node "$DIR/../cmd/polyline.js" $STREETDB 1>$POLYLINE_OUT 2>$POLYLINE_ERR;

echo "-- run conflate --";
cat $OPENADDRESSES | time -p node "$DIR/../cmd/oa.js" $ADDRESSDB $STREETDB 1>$OA_OUT 2>$OA_ERR 3>$OA_SKIP;

# echo "-- search for: (glasgow st, wellington, nz) --";
# { echo "ATTACH DATABASE '$STREETDB' as 'street';"; cat "$DIR/rtree.sql"; } | sqlite3 $ADDRESSDB;
#
# echo "-- search for addresses: (glasgow st, wellington, nz) --";
# { echo "ATTACH DATABASE '$STREETDB' as 'street';"; cat "$DIR/addresses.sql"; } | sqlite3 $ADDRESSDB;

echo "-- interpolation table: (glasgow st, wellington, nz) --";
node "$DIR/../cmd/search.js" $ADDRESSDB $STREETDB "-41.288788" "174.766843" "glasgow street";

# echo "-- street_rtree --";
# sqlite3 $STREETDB "SELECT * FROM street_rtree;";

# echo "-- street_polyline --";
# sqlite3 $STREETDB "SELECT * FROM street_polyline;";

# echo "-- street_names --";
# sqlite3 $STREETDB "SELECT * FROM street_names;";

# echo "-- street_address --";
# sqlite3 $STREETDB "SELECT * FROM street_address;";
