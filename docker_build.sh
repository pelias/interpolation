#!/bin/bash

# ensure environment variables are set
if [[ -z "${OSMPATH}" ]]; then
  2>&1 echo "error: environment variable OSMPATH not set"
  exit 1
fi
if [[ -z "${POLYLINEPATH}" ]]; then
  2>&1 echo "error: environment variable POLYLINEPATH not set"
  exit 1
fi

# read a list of available pbf/0sv files
shopt -s nullglob
PBF_FILES=(${OSMPATH}/*.pbf)
POLYLINE_FILES=(${POLYLINEPATH}/*.0sv)
shopt -u nullglob

# ensure at least one *.pbf file exists, warn if more than one was found
if [[ ${#PBF_FILES[@]} -eq 0 ]]; then
  2>&1 echo "error: no .pbf files found in ${OSMPATH}"
  exit 1
elif [[ ${#PBF_FILES[@]} -gt 1 ]]; then
  2>&1 echo "warning: multiple .pbf files found in ${OSMPATH}, only ${PBF_FILES[0]} was used"
fi

# ensure at least one *.0sv file exists, warn if more than one was found
if [[ ${#POLYLINE_FILES[@]} -eq 0 ]]; then
  2>&1 echo "error: no .0sv files found in ${POLYLINEPATH}"
  exit 1
elif [[ ${#POLYLINE_FILES[@]} -gt 1 ]]; then
  2>&1 echo "warning: multiple .0sv files found in ${POLYLINEPATH}, only ${POLYLINE_FILES[0]} was used"
fi

# update ENV vars to point to the first available files on disk
export PBF2JSON_FILE="${PBF_FILES[0]}"
export POLYLINE_FILE="${POLYLINE_FILES[0]}"

# run the build
exec ./script/build.sh
