#!/bin/bash

# search address table records for max 3 records required to perform interpolation

ADDRESS_DB="/data/address.db";
STREET_DB="/data/street.db";

P1="174.766843";
P2="-41.288788";

NAME="glasgow street";
NUMBER="18";

sqlite3 $ADDRESS_DB "ATTACH DATABASE '$STREET_DB' as 'street'; \
  WITH base AS (
    SELECT address.* FROM street.rtree
    JOIN street.names ON street.names.id = street.rtree.id
    JOIN address ON address.id = street.rtree.id
    WHERE (
      street.rtree.minX<=$P1 AND street.rtree.maxX>=$P1 AND
      street.rtree.minY<=$P2 AND street.rtree.maxY>=$P2
    )
    AND ( names.name='$NAME' )
    ORDER BY address.housenumber ASC
  )
  SELECT * FROM (
    (SELECT * FROM base WHERE housenumber < '$NUMBER' ORDER BY housenumber DESC LIMIT 1)
  ) UNION SELECT * FROM (
    (SELECT * FROM base WHERE housenumber >= '$NUMBER' ORDER BY housenumber ASC LIMIT 2)
  )
  ORDER BY housenumber ASC
  LIMIT 3;";
