
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

note: you can record a log of addresses which do not find a matching street. simply create an additional file descriptor, this will trigger the process to use it for logging. eg:

```bash
cat /data/oa/nz/countrywide.csv | time -p node cmd/oa oa.db street.db 3> skip.list
```

#### search address database for interpolation points on street
```bash
node cmd/search oa.db street.db "-41.288788" "174.766843" "glasgow street"
```

#### run a web server which exposes the search APIs via an HTTP interface
```bash
node cmd/server oa.db street.db
```

#### build docker image
this can take some time for the first build due to installing libpostal from source
```bash
docker build -t pelias/interpolation .
```

you can confirm that worked with:
```bash
docker images
REPOSITORY             TAG                 IMAGE ID            CREATED             SIZE
pelias/interpolation   latest              7ca651b86a63        16 minutes ago      3.068 GB
```

#### run docker image
this will run a new container based off the image created above

notes:
- `-p` controls port mapping (port `3000` in the container maps to `5000` in the host)
- `-v` controls volume mapping (`/data` in the container maps to `/data` in the host)

by default this will launch the server using the databases `/data/oa.db` and `/data/planet.db` which must be present on the host machine

```bash
docker run -p 5000:3000 -v /data:/data -d pelias/interpolation
```

you can confirm that worked with:
```bash
$ docker ps
CONTAINER ID        IMAGE                  COMMAND                  CREATED             STATUS              PORTS                    NAMES
ac9c8f607b2e        pelias/interpolation   "./interpolate server"   14 minutes ago      Up 14 minutes       0.0.0.0:5000->3000/tcp   jolly_hamilton
```

you should now be able to access the web server locally at `http://localhost:5000/demo/`

#### running scripts other than `server` in the docker container

you can run any command supported by `./interpolate` via the docker container, such as:

```bash
cat /data/new_zealand.polylines | docker run -i -v /data:/data pelias/interpolation polyline /data/nz.db
```
