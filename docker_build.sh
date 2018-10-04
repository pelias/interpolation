#!/bin/bash

# update ENV vars to point to the first available file on disk
export PBF2JSON_FILE=$(ls ${OSMPATH}/*.osm.pbf | head -n 1)
export POLYLINE_FILE=$(ls ${POLYLINEPATH}/*.0sv | head -n 1)

# run the build
exec ./script/build.sh
