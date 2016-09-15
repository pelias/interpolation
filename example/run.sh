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
cat $OPENADDRESSES | time -p node "$DIR/../conflate_csv.js" $DB;

echo "-- search for: (glasgow st, wellington, nz) --";
sqlite3 example.db < rtree.sql;

echo "-- search for addresses: (glasgow st, wellington, nz) --";
sqlite3 example.db < addresses.sql;

# echo "-- street_rtree --";
# sqlite3 example.db "SELECT * FROM street_rtree;";

# echo "-- street_polyline --";
# sqlite3 example.db "SELECT * FROM street_polyline;";

# echo "-- street_names --";
# sqlite3 example.db "SELECT * FROM street_names;";

# echo "-- street_address --";
# sqlite3 example.db "SELECT * FROM street_address;";
