#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# install the latest version of sqlite3

# you can fetch the latest version from http://www.sqlite.org/download.html
# look for the version which says "C source code as an amalgamation. Also includes a "configure" script"

# remove version provided by package manager
sudo apt-get remove sqlite3;

# download and extract source code
SOURCE="http://www.sqlite.org/2016/sqlite-autoconf-3150100.tar.gz";
wget -q $SOURCE;
tar xvfz $(basename "$SOURCE");

# compile source
cd $(basename "$SOURCE" ".tar.gz");
./configure;
make -j4;

# install
sudo make install;

# echo new version
sqlite3 -version;
