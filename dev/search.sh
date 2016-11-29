#!/bin/bash

# search address table records for records required to perform interpolation

ADDRESS_DB="/data/address.db";
STREET_DB="/data/street.db";

LON="174.766843";
LAT="-41.288788";

NAME="glasgow street";
NUMBER="18";

sqlite3 $ADDRESS_DB "ATTACH DATABASE '$STREET_DB' as 'street'; \
  WITH base AS ( \
    SELECT address.* FROM street.rtree \
    JOIN street.names ON street.names.id = street.rtree.id \
    JOIN address ON address.id = street.rtree.id \
    WHERE ( \
      street.rtree.minX<=$LON AND street.rtree.maxX>=$LON AND \
      street.rtree.minY<=$LAT AND street.rtree.maxY>=$LAT \
    ) \
    AND ( street.names.name='$NAME' ) \
    ORDER BY address.housenumber ASC \
  ) \
  SELECT * FROM ( \
    ( \
      SELECT * FROM base \
      WHERE housenumber < $NUMBER \
      GROUP BY id HAVING( MAX( housenumber ) ) \
      ORDER BY housenumber DESC \
    ) \
  ) UNION SELECT * FROM ( \
    ( \
      SELECT * FROM base \
      WHERE housenumber >= $NUMBER \
      GROUP BY id HAVING( MIN( housenumber ) ) \
      ORDER BY housenumber ASC \
    ) \
  ) \
  ORDER BY housenumber ASC \
  LIMIT 20;";
