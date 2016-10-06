#!/bin/bash

# concatenate all openaddresses csv files in to a single stream
# note: deduplicates lines in each file

OAPATH='/data/oa';

# only output the csv header once
HAS_OUTPUT_HEADER=false;

find $OAPATH -type f -iname "*.csv" ! -name '*summary*' -print0 |\
  while IFS= read -r -d $'\0' filename; do
    if [ "$HAS_OUTPUT_HEADER" = false ] ; then
      HAS_OUTPUT_HEADER=true;
      head -n1 $filename;
    fi
    # concat output (removing duplicates)
    # Use cat -n to prepend line numbers
    # Use sort -u remove duplicate data
    # Use sort -n to sort by prepended number
    # Use cut to remove the line numbering
    # cat -n $filename | tail -n +2 | sort -uk2 | sort -nk1 | cut -f2-;
    >&2 echo $filename;
    # tail -n +2 $filename;
    tail -n +2 $filename | LC_ALL=C sort -t, -k 4,4d -k 6,6d -k 7,7d -k 8,8d -k 3,3n;
  done;
