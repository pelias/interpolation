#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
DB="$DIR/example.db";
POLYLINES="/data/new_zealand.polylines";
OPENADDRESSES="/data/oa/nz/countrywide.csv";

# clean up old db files
rm "$DB*" &>/dev/null;

echo "-- run import --";
cat $POLYLINES | time -p node "$DIR/../polyline_import_master.js" $DB;

# echo "-- run conflate --";
# cat $OPENADDRESSES | time -p node "$DIR/../conflate_oa.js" $DB;
#
# echo "-- search for: (glasgow st, wellington, nz) --";
# sqlite3 $DB < "$DIR/rtree.sql";
#
# echo "-- search for addresses: (glasgow st, wellington, nz) --";
# sqlite3 $DB < "$DIR/addresses.sql";
#
# echo "-- interpolation table: (glasgow st, wellington, nz) --";
# node "$DIR/../search.js" "$DIR/example.db" "-41.288788" "174.766843" "glasgow street";
