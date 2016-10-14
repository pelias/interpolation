

## Using the command line

### help
> get information about which commands are available and list the arguments they accept

```bash
$ ./interpolate help

Usage: interpolate [command] [options]
Note: you will need to pipe data in to the import/conflate commands

 help                                                                      output usage information
 search [address_db] [street_db] [lat] [lon] [house_number] [street_name]  search database for specified housenumber + street
 polyline [street_db]                                                      import polyline data in to [street_db]
 oa [address_db] [street_db]                                               conflate oa csv file in to [address_db] using [street_db]
 extract [address_db] [street_db] [lat] [lon] [street_name]                extract street address data for debugging purposes
 server [address_db] [street_db]                                           start a web server
```

### search
> search the db for an address, return an interpolated value if an exact match does not exist

note: the lat/lon values you provide are in order to disambiguate the street, they must lie within the bounding box of the desired street.

```bash
./interpolate search address.db street.db "-41.288788" "174.766843" "16" "glasgow street"

type	interpolated
source	mixed
number	16
lat	-41.2886487
lon	174.7670925
```

### extract
> extract address data from the db for a specific street

note: the lat/lon values you provide are in order to disambiguate the street, they must lie within the bounding box of the desired street.

```bash
./interpolate extract address.db street.db "-41.288788" "174.766843" "glasgow street"

┌───────┬────┬────────┬─────────────┬─────────────┬─────────────┬────────┬─────────────┬─────────────┐
│ rowid │ id │ source │ housenumber │ lat         │ lon         │ parity │ proj_lat    │ proj_lon    │
├───────┼────┼────────┼─────────────┼─────────────┼─────────────┼────────┼─────────────┼─────────────┤
│ 5     │ 1  │ OA     │ 1           │ -41.2871999 │ 174.766753  │ R      │ -41.287285  │ 174.7666662 │
├───────┼────┼────────┼─────────────┼─────────────┼─────────────┼────────┼─────────────┼─────────────┤
│ 23    │ 1  │ VERTEX │ 2.535       │             │             │        │ -41.287388  │ 174.766845  │
├───────┼────┼────────┼─────────────┼─────────────┼─────────────┼────────┼─────────────┼─────────────┤
│ 22    │ 1  │ VERTEX │ 3.376       │             │             │        │ -41.287461  │ 174.766921  │
├───────┼────┼────────┼─────────────┼─────────────┼─────────────┼────────┼─────────────┼─────────────┤
...
```

# Using the web server

### Start the web server
> run a web server which exposes the search APIs via an HTTP interface

note: you can set an environment variable named 'PORT' to change the port number.
```bash
./interpolate server address.db street.db

server listening on port 3000
```

### GET /search/{format}
> search the db for an address, return an interpolated value if an exact match does not exist

- geojson: http://localhost:3000/search/geojson?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street
- html: http://localhost:3000/search/table?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street

### GET /extract/{format}
> extract address data from the db for a specific street

- geojson: http://localhost:3000/extract/geojson?lat=-41.288788&lon=174.766843&names=glasgow%20street
- html: http://localhost:3000/extract/table?lat=-41.288788&lon=174.766843&names=glasgow%20street

see: https://github.com/pelias/interpolation/blob/master/cmd/server.js for more information.

## Building your own database

### polyline
> import road network data in the polyline format

find data here: https://github.com/pelias/polylines
```bash
./interpolate polyline street.db < /data/new_zealand.polylines
```

### oa
> import openaddresses data and conflate it with the street data

find data here: https://openaddresses.io/
```bash
./interpolate oa address.db street.db < /data/oa/nz/countrywide.csv
```

note: you can record a log of addresses which do not find a matching street. simply create an additional file descriptor, this will trigger the process to use it for logging. eg:

```bash
cat /data/oa/nz/countrywide.csv | ./interpolate oa address.db street.db 3> skip.list
```

## docker

### build docker image
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

### run docker image
this will run a new container based off the image created above

notes:
- `-p` controls port mapping (port `3000` in the container maps to `5000` in the host)
- `-v` controls volume mapping (`/data` in the container maps to `/data` in the host)

by default this will launch the server using the databases `/data/address.db` and `/data/street.db` which must be present on the host machine

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

### running scripts other than `server` in the docker container

you can run any command supported by `./interpolate` via the docker container, such as:

```bash
cat /data/new_zealand.polylines | docker run -i -v /data:/data pelias/interpolation polyline /data/nz.db
```

### development

### install dependencies

*note:* [libpostal](https://github.com/openvenues/node-postal#troubleshooting) **must** be installed on your system before you continue!

```bash
npm install
```

### run tests
```bash
npm test
```

### run linter
```bash
git commit
```
