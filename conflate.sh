#!/bin/bash

find /data/oa -type f -iname "*.csv" -print0 | while IFS= read -r -d $'\0' line; do
  if grep -q "summary" "$line"; then
    echo "skip $line";
  else
    echo "conflate $line";
    echo "$line" >planet_conflate.out;
    bash -c "(cat $line | time -p node conflate_oa.js planet.db >planet_conflate.out) &> planet_conflate.err";
  fi;
done;
