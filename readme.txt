
-- run example
./example/run.sh;

-- import polyline data
cat /data/new_zealand.polylines | time -p node import.js "nz.db";

-- conflate openaddresses data
cat /data/oa/nz/countrywide.csv | time -p node conflate_csv.js "nz.db";
