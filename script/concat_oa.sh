#!/bin/bash
set -e;
export LC_ALL=en_US.UTF-8;

# concatenate all openaddresses csv files in to a single stream
# note: deduplicates lines in each file

# base path of openaddresses file system (use default unless param is supplied)
OAPATH=${OAPATH:-"/data/oa"};
if [ ! -d $OAPATH ]; then
  echo "openaddresses data dir does not exist";
  exit 1;
fi

# only output the csv header once
HAS_OUTPUT_HEADER=false;

# recurse through filesystem listing all .csv file names not containing the text "summary"
find $OAPATH -type f -iname "*.csv" ! -name '*summary*' -print0 |\
  while IFS= read -r -d $'\0' filename; do

    # output the header
    # LON,LAT,NUMBER,STREET,UNIT,CITY,DISTRICT,REGION,POSTCODE,ID,HASH
    if [ "$HAS_OUTPUT_HEADER" = false ] ; then
      HAS_OUTPUT_HEADER=true;
      head -n1 $filename | sed $'s/\r//'; # remove windows® newlines
    fi

    # echo filename to stderr
    >&2 echo $(date -u) "$filename";

    # generate the hash prefix for records in this file
    HASH_PREFIX="${filename#$OAPATH/}";
    HASH_PREFIX="${HASH_PREFIX%.*}";

    # start reading from line 2 (discard header)
    tail -n +2 $filename |\

      # remove windows® newlines
      sed $'s/\r//' |\

        # remove newline characters inside quoted text
        awk -v RS='"' 'NR % 2 == 0 { gsub(/\r?\n|\r/, " ") } { printf("%s%s", $0, RT) }' |\

          # create a HASH column for those which don't have one (or a very short one)
          awk -F ',' 'BEGIN { OFS = "," } { if( length($NF) < 2 ) $NF = sprintf( "%d", NR ); print }' |\

            # prepend the file name to the HASH column
            awk -F',' -v prefix=$HASH_PREFIX 'BEGIN { OFS = "," } { $NF = sprintf( "%s:%s", prefix, $NF ); print }' |\

              # sort the file by STREET, CITY, DISTRICT, REGION, NUMBER
              sort -t, -k 4,4d -k 6,6d -k 7,7d -k 8,8d -k 3,3n |\

                # remove duplicates
                uniq;
  done;

# awk test case:
# echo -e "name,\"foo\nbar\",0.0\n";

# sort test case:
# echo -e ",,1,b,,a,a,a\n,,2,a,,a,b,a\n,,1,a,,a,b,a\n,,1,a,,a,a,a\n";
