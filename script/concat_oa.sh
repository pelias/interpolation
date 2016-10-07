#!/bin/bash
set -e;

# concatenate all openaddresses csv files in to a single stream
# note: deduplicates lines in each file

# avoid locale issues with the sort command
export LC_ALL=C;

# base path of openaddresses file system
OAPATH='/data/oa';

# only output the csv header once
HAS_OUTPUT_HEADER=false;

find $OAPATH -type f -iname "*.csv" ! -name '*summary*' -print0 |\
  while IFS= read -r -d $'\0' filename; do

    # output the header
    # LON,LAT,NUMBER,STREET,UNIT,CITY,DISTRICT,REGION,POSTCODE,ID,HASH
    if [ "$HAS_OUTPUT_HEADER" = false ] ; then
      HAS_OUTPUT_HEADER=true;
      head -n1 $filename;
    fi

    # echo filename to stderr
    >&2 echo $(date -u) "$filename";

    # start reading from line 2 (discard header)
    tail -n +2 $filename |\

     # remove newline characters inside quoted text
     gawk -v RS='"' 'NR % 2 == 0 { gsub(/\r?\n|\r/, " ") } { printf("%s%s", $0, RT) }' |\

      # sort the file by STREET, CITY, DISTRICT, REGION, NUMBER
      sort -t, -k 4,4d -k 6,6d -k 7,7d -k 8,8d -k 3,3n |\

       # remove duplicates
       uniq;
  done;
