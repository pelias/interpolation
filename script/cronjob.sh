#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# build a fresh version of the database files (via cronjob)
# see: ./script/build.sh for build options.

# example:
# m h  dom mon dow   command
# 0 17 * * * /bin/bash /home/peter/repos/interpolation/script/cronjob.sh

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
cd "$DIR/../";

# node binary path (commonly installed to a location not on the cron PATH)
export PATH=$PATH:/usr/local/bin

# update git repo
git pull -q origin master;

# update npm dependencies
npm --loglevel=silent install;

# update openaddresses data (optional)
export OAPATH="/data/oa"; # base path of openaddresses file system
$DIR/update_oa.sh;

# update tiger data (optional)
export TIGERPATH="/data/tiger"; # base path of tiger file system
$DIR/update_tiger.sh;

# run build
$DIR/build.sh &> build.log;
