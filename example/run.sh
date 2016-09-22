#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
STREETDB="$DIR/street.db";
ADDRESSDB="$DIR/address.db";
POLYLINES="$DIR/glasgow_street.polylines";
OPENADDRESSES="$DIR/oa_nz_glasgow_streets.csv";

# clean up old db files
rm "$STREETDB" &>/dev/null;
rm "$ADDRESSDB" &>/dev/null;

echo "-- run import --";
cat $POLYLINES | time -p node "$DIR/../import.js" $STREETDB;

echo "-- run conflate --";
cat $OPENADDRESSES | time -p node "$DIR/../conflate_oa.js" $ADDRESSDB $STREETDB;

echo "-- search for: (glasgow st, wellington, nz) --";
{ echo "ATTACH DATABASE '$STREETDB' as 'street';"; cat "$DIR/rtree.sql"; } | sqlite3 $ADDRESSDB;

echo "-- search for addresses: (glasgow st, wellington, nz) --";
{ echo "ATTACH DATABASE '$STREETDB' as 'street';"; cat "$DIR/addresses.sql"; } | sqlite3 $ADDRESSDB;

echo "-- interpolation table: (glasgow st, wellington, nz) --";
node "$DIR/../search.js" $ADDRESSDB $STREETDB "-41.288788" "174.766843" "glasgow street";

# echo "-- street_rtree --";
# sqlite3 $STREETDB "SELECT * FROM street_rtree;";

# echo "-- street_polyline --";
# sqlite3 $STREETDB "SELECT * FROM street_polyline;";

# echo "-- street_names --";
# sqlite3 $STREETDB "SELECT * FROM street_names;";

# echo "-- street_address --";
# sqlite3 $STREETDB "SELECT * FROM street_address;";
