#!/bin/bash

# concatenate all openaddresses csv files in to a single stream
# note: deduplicates lines in each file

OAPATH='/data/oa';

find $OAPATH -type f -iname "*.csv" ! -name '*summary*' -print0 |\
  while IFS= read -r -d $'\0' filename; do
    # concat output (removing duplicates)
    # Use cat -n to prepend line numbers
    # Use sort -u remove duplicate data
    # Use sort -n to sort by prepended number
    # Use cut to remove the line numbering
    cat -n $filename | sort -uk2 | sort -nk1 | cut -f2-;
  done;
