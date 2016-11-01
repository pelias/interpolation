#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# download all openaddresses csv files, overriding existing files
URL="http://s3.amazonaws.com/data.openaddresses.io/openaddr-collected-global.zip";

# base path of openaddresses file system (use default unless param is supplied)
OAPATH=${OAPATH:-"/data/oa"};
if [ ! -d $OAPATH ]; then
  echo "openaddresses data dir does not exist";
  exit 1;
fi

# create directory if it doesn't exist
mkdir -p $OAPATH;

# delete directory contents
cd $OAPATH;
find -mindepth 1 -maxdepth 1 -print0 | xargs -0 rm -rf;

# download latest zip file
wget "$URL";

ZIPFILE=$(basename "$URL");
unzip -o "$ZIPFILE";
