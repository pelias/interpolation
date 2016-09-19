
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
