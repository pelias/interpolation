
#### install dependencies
```bash
npm install;
```

#### run example
```bash
./example/run.sh;
```

#### import polyline data
find data here: https://github.com/pelias/polylines
```bash
cat /data/new_zealand.polylines | time -p node import nz.db;
```

#### conflate openaddresses data
find data here: https://openaddresses.io/
```bash
cat /data/oa/nz/countrywide.csv | time -p node conflate_oa nz.db;
```

#### search address database for interpolation points on street
```bash
node search nz.db "-41.288788" "174.766843" "glasgow street";
```

find /data/oa -type f -iname "*.csv" -print0 | while IFS= read -r -d $'\0' line; do
  if grep -q "summary" "$line"; then
    # skip
  else
    echo "$line" >planet_conflate.out;
    bash -c "(cat $line | time -p node conflate_oa.js planet.db >planet_conflate.out) &> planet_conflate.err";
  fi;
done;


nohup bash -c "(cat /data/road_network.polylines | time -p node polyline_import_master.js planet.db >planet.out) &> planet.err"

nohup bash -c "(cat /data/road_network.polylines | time -p node polyline_import_master.js planet.db >planet.out) &> planet.err"
