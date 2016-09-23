#!/bin/bash

OAPATH='/data/oa';
rm 'planet_conflate.out' 'planet_conflate.err' &>/dev/null;

find $OAPATH -type f -iname "*.csv" -print0 | while IFS= read -r -d $'\0' filename; do
  if grep -q "summary" "$filename"; then
    echo "skip $filename";
  else
    echo "conflate $filename";
    echo "$filename" >>planet_conflate.out;
    bash -c "(cat $filename | time -p node conflate_oa.js oa.db planet.db >>planet_conflate.out) &>> planet_conflate.err";
  fi;
done;
