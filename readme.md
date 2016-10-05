
#### install dependencies

*note:* [libpostal](https://github.com/openvenues/node-postal#troubleshooting) must be installed on your system.

```bash
npm install;
```

#### run tests
```bash
npm t;
```

#### run example
```bash
./example/run.sh;
```

#### import polyline data
find data here: https://github.com/pelias/polylines
```bash
cat /data/new_zealand.polylines | time -p node cmd/polyline street.db;
```

#### conflate openaddresses data
find data here: https://openaddresses.io/
```bash
cat /data/oa/nz/countrywide.csv | time -p node cmd/oa oa.db street.db;
```

#### search address database for interpolation points on street
```bash
node cmd/search oa.db street.db "-41.288788" "174.766843" "glasgow street";
```
