#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
DB="$DIR/example.db";
POLYLINES="$DIR/glasgow_street.polylines";
OPENADDRESSES="$DIR/oa_nz_glasgow_streets.csv";

# clean up old db files
rm "$DB*" &>/dev/null;

echo "-- run import --";
cat $POLYLINES | time -p node "$DIR/../import.js" $DB;

echo "-- run conflate --";
cat $OPENADDRESSES | time -p node "$DIR/../conflate_oa.js" $DB;

echo "-- search for: (glasgow st, wellington, nz) --";
sqlite3 $DB < "$DIR/rtree.sql";

echo "-- search for addresses: (glasgow st, wellington, nz) --";
sqlite3 $DB < "$DIR/addresses.sql";

echo "-- interpolation table: (glasgow st, wellington, nz) --";
node "$DIR/../search.js" "$DIR/example.db" "-41.288788" "174.766843" "glasgow street";

# echo "-- street_rtree --";
# sqlite3 $DB "SELECT * FROM street_rtree;";

# echo "-- street_polyline --";
# sqlite3 $DB "SELECT * FROM street_polyline;";

# echo "-- street_names --";
# sqlite3 $DB "SELECT * FROM street_names;";

# echo "-- street_address --";
# sqlite3 $DB "SELECT * FROM street_address;";
