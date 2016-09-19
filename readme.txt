
-- run example
./example/run.sh;

-- import polyline data
cat /data/new_zealand.polylines | time -p node import nz.db;

-- conflate openaddresses data
cat /data/oa/nz/countrywide.csv | time -p node conflate_oa nz.db;

-- search address database for interpolation points on street
node search nz.db "-41.288788" "174.766843" "glasgow street"
