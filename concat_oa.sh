#!/bin/bash

OAPATH='/data/oa';

find $OAPATH -type f -iname "*.csv" ! -name '*summary*' -print0 | while IFS= read -r -d $'\0' filename; do
  cat $filename;
done;
