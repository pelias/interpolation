
#### install dependencies

*note:* [libpostal](https://github.com/openvenues/node-postal#troubleshooting) must be installed on your system.

```bash
npm install
```

#### run tests
```bash
npm test
```

#### run example
```bash
./example/run.sh
```

#### import polyline data
find data here: https://github.com/pelias/polylines
```bash
cat /data/new_zealand.polylines | time -p node cmd/polyline street.db
```

#### conflate openaddresses data
find data here: https://openaddresses.io/
```bash
cat /data/oa/nz/countrywide.csv | time -p node cmd/oa oa.db street.db
```

#### search address database for interpolation points on street
```bash
node cmd/search oa.db street.db "-41.288788" "174.766843" "glasgow street"
```

#### run a web server which exposes the search APIs via an HTTP inetrface
```bash
node cmd/server oa.db street.db
```

#### build docker image
```bash
docker build -t pelias/interpolation .
```

#### run docker image
this will run a new container based off the image created above

notes:
- `-p` controls port mapping (port `3000` in the container maps to `5000` in the host)
- `-v` controls volume mapping (`/data` in the container maps to `/data` in the host)

by default this will launch the server using the databases `/data/oa.db` and `/data/planet.db`

```bash
docker run -p 5000:3000 -v /data:/data -d pelias/interpolation
```
