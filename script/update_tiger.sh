#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# download all addrfeat files via their FTP site
# URL="ftp://ftp2.census.gov/geo/tiger/TIGER2021/ADDRFEAT/";

# download path of tiger files (use default unless param is supplied)
TIGERPATH=${TIGERPATH:-"$WORKINGDIR/data/tiger"};

# create directory if it doesn't exist
mkdir -p $TIGERPATH/downloads;

# ensure lftp exists and is executable
if [[ ! -f /usr/bin/lftp || ! -x /usr/bin/lftp ]]; then
  echo "lftp not installed on system";
  exit 1;
fi

# sync files from FTP server
lftp <<-SCRIPT
  open ftp2.census.gov
  mirror -e -n -r --parallel=20 --ignore-time /geo/tiger/TIGER2021/ADDRFEAT/ $TIGERPATH/downloads
  exit
SCRIPT
