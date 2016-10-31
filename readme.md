
An open source + open data project to perform global street address interpolation queries. Sponsored by [mapzen](http://www.mapzen.com).

# About

The [Openstreetmap](http://www.openstreetmap.com) and [Openaddresses](http://www.openaddresses.com) projects provide a huge cache of street address information; between them around 250 million address points are freely available to download.

Some countries like Germany and the USA have dense address coverage while other have only sparse data available.

This project aims to 'fill in the gaps' in the data by intelligently estimating where the missing house numbers would lie on the road.

The service was designed for use with the [pelias geocoder](https://github.com/pelias/pelias), however it can also be used as a stand-alone application or included with other geographic software / search engines.

more info: [[design doc](https://github.com/pelias/pelias/wiki/Interpolation:-design-doc)] [[relationship to pelias](https://github.com/pelias/pelias/wiki/Interpolation:-introduction)] [[existing standards](https://github.com/pelias/pelias/wiki/Interpolation:-existing-standards)] [[conflation](https://github.com/pelias/pelias/wiki/Interpolation:-conflation)]

# Architecture

The software is written in javascript to run in nodejs, the storage engine is sqlite3.

Client libraries can be written in any language which can read sqlite3. If you wish to write a client in another language please open an issue and we can explain which functions you will need to port.

The software is split in to 4 distinct parts:

- the street (polyline) importer
- the address (openaddresses) importer
- the geometry (vertices) interpolation
- the client APIs (the webserver and CLI interface)

The data is split in to 2 different sqlite3 databases:

- street.db (holds information about streets, geometry, their names and bounding boxes)
- address.db (holds address point data, both rooftop accuracy and pre-interpolated vertex data)

# Downloading pre-built data

Mapzen provides data extracts which you can download and get going immediately.

[coming soon]

# Workflow

### street database

Firstly you need to build the `street.db` database.

You will need a polyline data file which contains all the streets you wish to import, you can find some pre-made extracts [here](https://github.com/pelias/polylines) and there is also information on that readme about how to generate your own extracts.

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

There is also a script named `./script/import.sh` in this repository which makes running this process much easier.

note: We only support the `polyline` format, you will need to format-shift data from other formats in order to import it.

### address database

Next you need to build the `address.db` database.

You will need to download one or more `openaddresses` csv files for the addresses you wish to import, you can find all the data on the [openaddresses website](https://openaddresses.io/).

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

There is also a script named `./script/conflate.sh` in this repository which makes running this process much easier.

note: We only support `openaddreses` at this stage although we plan to support `openstreetmap` and other sources soon.

### precompute geometry

Finally we will compute the fractional house numbers for each vertex (corner) of the street and add them to the `address.db` database.

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

# Using the command line

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
 vertices [address_db] [street_db]                                         compute fractional house number for line vertices
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

`geojson`: `/search/geojson?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street`

`html`: `/search/table?lat=-41.288788&lon=174.766843&number=16&street=glasgow%20street`

### GET /extract/{format}
> extract address data from the db for a specific street

`geojson`: `/extract/geojson?lat=-41.288788&lon=174.766843&names=glasgow%20street`

`html`: `/extract/table?lat=-41.288788&lon=174.766843&names=glasgow%20street`

see: [source](https://github.com/pelias/interpolation/blob/master/cmd/server.js) for more information.

# Building the databases

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

note: sorting the openaddresses files so that addresses on the same street are adjacent will significantly speed up imports, you can find an example of the commands required to sort the data in `./script/concat_oa.sh`.

### vertices
> compute fractional house numbers for the street vertices

```bash
./interpolate vertices address.db street.db
```

#### logging

you can record a log of addresses which do not find a matching street. simply create an additional file descriptor, this will trigger the process to use it for logging. eg:

```bash
cat /data/oa/nz/countrywide.csv | ./interpolate oa address.db street.db 3> skip.list
```

# docker

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
- `-d` tells docker to run the container in the background (daemonize)

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

# development

### install dependencies

*note:* [libpostal](https://github.com/openvenues/node-postal#troubleshooting) **must** be installed on your system before you continue!

The `Dockerfile` in this repo has complete instructions on how to install everything from scratch on Ubuntu.

```bash
npm install
```

### run tests
```bash
npm test
```

### run linter
note: if you are using the `atom` editor, we recommend the [jshint](https://atom.io/packages/jshint) plugin.
```bash
git commit
```

# functional tests

this repo contains a bunch of functional end-to-end tests in the [./test/functional](https://github.com/pelias/interpolation/tree/master/test/functional) directory.

each test contains a [reports](https://github.com/pelias/interpolation/tree/master/test/functional/basic/reports) directory which contains human-readable visual output of each test case, including a geojson map view showing all the point data.

### create a new functional test

the easiest/best way to debug an issue is to create a new functional test case and use the test suite to assert conditions and generate visual output which you can inspect.

these are the steps I took to create the `potsdamerplatz` test case:

```bash
# copy an existing test case
cp -r test/functional/basic test/functional/potsdamerplatz

# extract the relevant polylines from a large polyline source
grep -Pia "potsdamer\s?(platz|strasse|straße)" /data/planet.polylines > test/functional/potsdamerplatz/osm.polylines

# extract the relevant address points from a large openaddresses file (header line then body)
head -n1 /data/oa/de/berlin.csv > test/functional/potsdamerplatz/oa.csv
grep -Pia "potsdamer\s?(platz|strasse|straße)" /data/oa/de/berlin.csv >> test/functional/potsdamerplatz/oa.csv
```

next add that test case to `./test/_func.js` in order to it run every time anyone runs `npm test`.

you can now edit the contents of `test/functional/potsdamerplatz/run.js` to suit your needs, you should rename the text at the bottom of the file which says something like `"functional: basic"` to be more descriptive, in this case we will call it `"functional: potsdamerplatz"`. now the output from `npm test` will include that label next to each assertion run in the file.

great! you can skip the units tests and only run the functional tests with `npm run funcs`, go ahead and do that now and you will see your new tests failing; which is good! if you are going to be running that command a lot and you don't care to wait on the other tests, you can comment them out in `./test/_func.js`.

now your test case is running it's time to have a poke around in that new directory you made.

running the tests will produce new `street.db` & `address.db` files, you can query them directly from the command line to check what's inside them looks correct:

```bash
sqlite3 test/functional/potsdamerplatz/street.db "SELECT * FROM polyline JOIN names ON polyline.id = names.id WHERE names.name LIKE '%platz%'"
```

or you can start an interactive shell and have a poke around in there:

```bash
sqlite3 test/functional/potsdamerplatz/street.db

SQLite version 3.8.11.1 2015-07-29 20:00:57
Enter ".help" for usage hints.

sqlite> select count(*) from polyline;
64

sqlite> .exit
```

you'll find a subdirectory called `./fixture` which is where all your data fixtures will live, you can query the database directly and save the response to that directory with a command such as:

```bash
sqlite3 test/functional/potsdamerplatz/address.db "SELECT * FROM address WHERE id = 1" > test/functional/potsdamerplatz/fixture/expected.dump
```

if you're hunting for a specific road segment to debug, you can open up your `test/functional/potsdamerplatz/osm.polylines` file and try to find the appropriate line in there, the line numbers will correspond to the ids, so the first line in that file is id=1 in the `street.db`.

to visually inspect the polylines, you can cut them before the name and paste them in the search box here: http://valhalla.github.io/demos/polyline/

example:
```
ii|ccBsskoX_@wLaAkUi@sJ{@oM??mHn@??HtL~IUvGc@zJyA|Cg@tCkAhBkA~EyDpBaDnGgIeBqEoEnGwGvEqAz@wAr@qC|@wMl@mJ^
```

likewise if you are looking for a specific address, you can open up `test/functional/potsdamerplatz/oa.csv` and find the address in there (be aware that some very precise floating point numbers get truncated and so may not match exactly in tools like grep), you should then be able to find them in the `address.db`:

```
sqlite3 test/functional/potsdamerplatz/address.db "SELECT * FROM address" | grep "52.5046774"

45|1|OA|59.0|52.5046774|13.3676731|R|52.5047673|13.3674717
```

you'll also find a subdirectory called `./reports` which you can use to spot check the data, if you have [geojsonio](https://github.com/mapbox/geojsonio-cli) installed you can pipe the file directly to the web:

```bash
cat test/functional/potsdamerplatz/reports/preview.geojson | geojsonio
```

once you have completed your tests and committed the files, your preview files will be visible to everyone via github.

the `./reports` directory also contains the `stdio` files from each command that was executed and a list of records which failed to conflate. these files are ignored by `.gitignore` so they don't show up on github.
