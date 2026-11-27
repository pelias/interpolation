#!/bin/bash
set -eo pipefail;
export LC_ALL=en_US.UTF-8;

# concatenate all openaddresses csv and geojson files in to a single stream
# note: deduplicates lines in each file

# base path of openaddresses file system (use default unless param is supplied)
OAPATH=${OAPATH:-"/data/oa"};

# OpenAddresses no longer publish CSV files, convert their GeoJSON format to
# the legacy CSV format with HASH as the final (unquoted) column
function geojson_to_csv() {
  jq -r 'select(.geometry.type == "Point") | ([
    .geometry.coordinates[0],
    .geometry.coordinates[1],
    .properties.number,
    .properties.street,
    .properties.unit,
    .properties.city,
    .properties.district,
    .properties.region,
    .properties.postcode,
    .properties.id
  ] | @csv) + "," + (.properties.hash // "")' "$1"
}

# output the header
echo 'LON,LAT,NUMBER,STREET,UNIT,CITY,DISTRICT,REGION,POSTCODE,ID,HASH';

# projects without OpenAddresses data have no data dir, which isn't an error
if [ ! -d $OAPATH ]; then
  >&2 echo "openaddresses data dir does not exist, skipping";
  exit 0;
fi

# exclude OpenAddresses summary files, they contain statistics rather than addresses
find $OAPATH -type f \( -iname "*.csv" -o -iname "*.geojson" \) ! -name '*summary*' -print0 |\
  while IFS= read -r -d $'\0' filename; do

    # echo filename to stderr
    >&2 echo $(date -u) "$filename";

    # generate the hash prefix for records in this file
    HASH_PREFIX="${filename#$OAPATH/}";
    HASH_PREFIX="${HASH_PREFIX%.*}";

    if [[ "${filename,,}" == *.geojson ]]; then
      geojson_to_csv "$filename";
    else
      # start reading from line 2 (discard header)
      tail -n +2 "$filename";
    fi |\

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
