#!/bin/bash

# location of sql databases
ADDRESS_DB='/data/oa.db';
STREET_DB='/data/planet.db';

# location of stdio files
PROC_STDOUT='/data/conflate.out';
PROC_STDERR='/data/conflate.err';

# delete stdio files
rm $PROC_STDOUT $PROC_STDERR &>/dev/null;

# run import
bash -c "./concat_oa.sh | time -p node conflate_oa.js $ADDRESS_DB $STREET_DB 1>$PROC_STDOUT 2>$PROC_STDERR";
