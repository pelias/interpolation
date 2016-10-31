#!/bin/bash
set -e;
export LC_ALL=C;

# build a fresh version of the database files (via cronjob)
# see: ./script/build.sh for build options.

# location of this file in filesystem
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
cd "$DIR/../";

# node binary path (commonly installed to a location not on the cron PATH)
export PATH=$PATH:/usr/local/bin

# update git repo
git pull -q origin master;

# update npm dependencies
npm --loglevel=silent install;

# run build
./script/build.sh &> build.log;
