>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias Interpolation Service

An open source + open data project to perform global street address interpolation queries.

![header](http://missinglink.embed.s3.amazonaws.com/interpolation-title.png)

# About

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/interpolation.svg)](https://greenkeeper.io/)

The [Openstreetmap](http://www.openstreetmap.com) and [Openaddresses](http://www.openaddresses.io) projects provide a huge cache of street address information; between them around 500 million address points are freely available to download.

Some countries like Germany and the USA have dense address coverage while other have only sparse data available.

This project aims to 'fill in the gaps' in the data by intelligently estimating where the missing house numbers would lie on the road.

The service was designed for use with the [pelias geocoder](https://github.com/pelias/pelias), however it can also be used as a stand-alone application or included with other geographic software / search engines.

more info: [[design doc](https://github.com/pelias/pelias/wiki/Interpolation:-design-doc)] [[relationship to pelias](https://github.com/pelias/pelias/wiki/Interpolation:-introduction)] [[existing standards](https://github.com/pelias/pelias/wiki/Interpolation:-existing-standards)] [[conflation](https://github.com/pelias/pelias/wiki/Interpolation:-conflation)]

# Architecture

The software is written in javascript to run in nodejs, the storage engine is sqlite3.

Client libraries can be written in any language which can read sqlite3. If you wish to write a client in another language please open an issue and we can explain which functions you will need to port.

The software is split in to 6 distinct parts:

- the street (polyline) importer
- the openaddresses address importer
- the openstreetmap address + address range importer
- the T.I.G.E.R. block range importer
- the geometry (vertices) interpolation
- the client APIs (the webserver and CLI interface)

The data is split in to 2 different sqlite3 databases:

- street.db (holds information about streets, geometry, their names and bounding boxes)
- address.db (holds address point data, both rooftop accuracy and pre-interpolated vertex data)

# Workflow

### street database

Firstly you need to build the `street.db` database.

You will need a polyline data file which contains all the streets you wish to import, you can find some pre-made extracts [here](https://github.com/pelias/polylines) and there is also information on that readme about how to generate your own extracts.

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

There is also a script named `./script/import.sh` in this repository which makes running this process much easier.

note: We only support the `polyline` format, you will need to format-shift data from other formats in order to import it.

### address database

Next you need to build the `address.db` database.

You will need to download one or more `openaddresses` or `openstreetmap` files for the addresses you wish to import.

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

There are scripts named `./script/conflate_oa.sh` and `./script/conflate_osm.sh` in this repository which make running this process much easier.

note: We only support `openaddreses` and `openstreetmap` formats, you will need to create a custom importer for other sources.

### precompute geometry

Finally we will compute the fractional house numbers for each vertex (corner) of the street and add them to the `address.db` database.

See the [building the databases](https://github.com/pelias/interpolation#building-the-databases) section below for detailed information on which commands to run.

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

### osm
> import openstreetmap data and conflate it with the street data

find data here: https://mapzen.com/data/metro-extracts/

the importer expects the OSM data in the JSON format exported by https://github.com/pelias/pbf2json, this format is not strictly equivalent to the http://overpass-api.de/output_formats.html#json standard, be aware.

for now it's best to use `pbf2json` to convert a `.osm.pbf` file in to json, then pipe that data in to `./interpolate osm`:

```bash
./build/pbf2json.linux-x64 -tags="addr:housenumber+addr:street" london.osm.pbf > osm_data.json
```

```bash
./interpolate osm address.db street.db < osm_data.json
```

### tiger
> import US Census Bureau TIGER data and conflate it with the street data

find data here: https://www.census.gov/geo/maps-data/data/tiger-line.html

a script is provided in `./script/update_tiger.sh` which will download files for the whole of the USA, this script is safe to run multiple times as it will only update the data which has changed.

```bash
./interpolate tiger address.db street.db
```

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
  osm [address_db] [street_db]                                              conflate osm file in to [address_db] using [street_db]
  tiger [address_db] [street_db]                                            conflate tiger address range geojson file in to [address_db] using [street_db]
  vertices [address_db] [street_db]                                         compute fractional house numbers for line vertices
  extract [address_db] [street_db] [lat] [lon] [street_name]                extract street address data for debugging purposes
  server [address_db] [street_db]                                           start a web server

  build                                                                     run the import script
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

### GET /street/near/geojson
> find the 100 nearest streets to a specific lat/lon pair, ordered by distance ASC

`geojson`: `/street/near/geojson?lat=-41.288788&lon=174.766843`

### GET /street/{id}/geojson
> return the geometry for a specific street id

`geojson`: `/street/10/geojson`

see: [source](https://github.com/pelias/interpolation/blob/master/cmd/server.js) for more information.

# docker

### build docker image
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

this will launch the server using the databases `/tmp/address.db` and `/tmp/street.db` which must be present on the host machine

```bash
docker run -p 5000:3000 -v /tmp:/data -d pelias/interpolation ./interpolate server /tmp/address.db /tmp/street.db
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
cat /data/new_zealand.polylines | docker run --rm -it -v /data:/data pelias/interpolation ./interpolate polyline /data/nz.db
```

### running a build in the docker container

The build scripts are configurable via a combination of environment variables and a `pelias-config` json file.
You will need to download your data before running the build command.

To make use of the `pelias-config` functionality, you'll need to create a new json file called `pelias.json` for example.
The relevant parts of that new file should look as follows. To direct to download script to this file,
the `PELIAS_CONFIG` environment variable should be set. You can read more details on how to use the `pelias-config` module
[here](https://github.com/pelias/config).

```javascript
{
  "imports": {
    "interpolation": {
      "download": {
        "tiger": {
          "datapath": "/tmp/data/tiger/",
          "states": [
            {
              "state_code": 41
            }
          ]
        }
      }
    }
  }
}
```

Note that `datapath` will default to `./data/downloads` if not specified.

To filter the TIGER data download you can set `state_code` property in the `pelias-config` file to the 2 digit code of the state to be downloaded.

Note: some state codes begin with a leading zero, you may specify a string value or omit the extra zero and provide an integer value.

In the example configuration above, the state code for Oregon, `41`, is used to limit the download.

The state code can found by referencing the table below. If no `state_code` value is found, all US data will be downloaded.

| code | state |
| --- | --- |
| 01 | Alabama              |
| 02 | Alaska               |
| 04 | Arizona              |
| 05 | Arkansas             |
| 06 | California           |
| 08 | Colorado             |
| 09 | Connecticut          |
| 10 | Delaware             |
| 11 | District of Columbia |
| 12 | Florida              |
| 13 | Georgia              |
| 15 | Hawaii               |
| 16 | Idaho                |
| 17 | Illinois             |
| 18 | Indiana              |
| 19 | Iowa                 |
| 20 | Kansas               |
| 21 | Kentucky             |
| 22 | Louisiana            |
| 23 | Maine                |
| 24 | Maryland             |
| 25 | Massachusetts        |
| 26 | Michigan             |
| 27 | Minnesota            |
| 28 | Mississippi          |
| 29 | Missouri             |
| 30 | Montana              |
| 31 | Nebraska             |
| 32 | Nevada               |
| 33 | New Hampshire        |
| 34 | New Jersey           |
| 35 | New Mexico           |
| 36 | New York             |
| 37 | North Carolina       |
| 38 | North Dakota         |
| 39 | Ohio                 |
| 40 | Oklahoma             |
| 41 | Oregon               |
| 42 | Pennsylvania         |
| 72 | Puerto Rico          |
| 44 | Rhode Island         |
| 45 | South Carolina       |
| 46 | South Dakota         |
| 47 | Tennessee            |
| 48 | Texas                |
| 49 | Utah                 |
| 50 | Vermont              |
| 51 | Virginia             |
| 53 | Washington           |
| 54 | West Virginia        |
| 55 | Wisconsin            |
| 56 | Wyoming              |

For more fine-grained control, you can also set the `county_code` property in the `pelias-config` file to the 3 digit code of the county to be downloaded.

Note: some county codes begin with a leading zero, you may specify a string value or omit the extra zero and provide an integer value.

Note: you must specify a `state_code` when specifying a `county_code`.

```
"states": [
  {
    "state_code": 41, "county_code": 1
  }
]
```

Check [the census website](https://www.census.gov/geographies/reference-files/2016/demo/popest/2016-fips.html) for a complete list of state and county FIPS codes.

### docker example

```bash
# prepare a build directory and a data directory to hold the newly created database files
mkdir -p /tmp/data/berlin

# download polyline street data
curl -s http://missinglink.files.s3.amazonaws.com/berlin.gz | gzip -d > /tmp/data/berlin.0sv

# download and extract openaddresses data
curl -s https://s3.amazonaws.com/data.openaddresses.io/runs/142027/de/berlin.zip > /tmp/data/berlin.zip
unzip /tmp/data/berlin.zip -d /tmp/data

# download openstreetmap data
curl -s https://s3.amazonaws.com/metro-extracts.mapzen.com/berlin_germany.osm.pbf > /tmp/data/berlin.osm.pbf

# download tiger data (note data directory will be created if it doesn't exist)
export PELIAS_CONFIG=./pelias.json
npm run download-tiger
```

we will mount `/tmp/data` on the local machine as `/data` inside the container, so be careful to set paths as they appear inside the container.

```bash
docker run -i \ # run interactively (optionally daemonize with -d)
  -v /tmp/data:/data \ # volume mapping
  -e 'BUILDDIR=/data/berlin' \ # location where the db files will be created
  -e 'POLYLINE_FILE=/data/berlin.0sv' \ # location of the polyline data
  -e 'OAPATH=/data/de' \ # location of the openaddresses data
  -e 'PBF2JSON_FILE=/data/berlin.osm.pbf' \ # location of the openstreetmap data
  pelias/interpolation ./interpolate build
```

once completed you should find the newly created `street.db` and `address.db` files in `/tmp/data/berlin` on your local machine.

# Configuration with Pelias Geocoder API

To use Interpolation service with the Pelias API, [configure the pelias config file](https://github.com/pelias/api#pelias-config) with the port that interpolation is running on.

# development

### install dependencies

The `Dockerfile` in this repo has complete instructions on how to install everything from scratch on Ubuntu.

### TIGER dependency on GDAL

The TIGER importer requires the `ogr2ogr` binary from `gdal` version 2+ in order to extract data from the `.shp` files provided by the US Census Bureau.

On linux this you can install this with a command such as `sudo apt-get install gdal-bin`, on OSX you will need to follow [this guide](https://www.karambelkar.info/2016/10/gdal-2-on-mac-with-homebrew/).

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

# extract the relevant address points from an openstreetmap PBF extract
# see: https://github.com/pelias/pbf2json
./build/pbf2json.linux-x64 -tags="addr:housenumber+addr:street" /data/extract/greater-london-latest.osm.pbf | grep -i nevern > test/functional/nevern_square/osm.addresses.json
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

### Updating the mock libpostal responses

Because of the high memory and disk space requirements of libpostal, tests can be run using a list of known libpostal responses, rather than calling libpostal itself.

These mock responses are stored in `test/lib/mock_libpostal_responses.json`. They will be used by the tests as long as the `MOCK_LIBPOSTAL` environment variable is set.

When libpostal itself changes, these mock responses need to be updated. Running the tests with `SEED_MOCK_LIBPOSTAL` set as well will cause the mock library to actually call libpostal itself, and update `mock_libpostal_responses.json`.
