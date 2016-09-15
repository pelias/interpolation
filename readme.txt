
-- run import
rm nz.db; cat /data/new_zealand.polylines | time -p node import.js;

-- run conflate
cat /data/oa/nz/countrywide.csv | time -p node conflate_csv.js;
