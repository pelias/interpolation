#!/bin/bash

# perform multiple rtree lookups in a single query

STREET_DB="/data/street.db";

P1="174.7526974";
P2="-36.3702506";

P3="174.7470381";
P4="-36.3697364";

P5="174.747747";
P6="-36.380012";

P7="174.7435055";
P8="-36.3787955";

NAME="whitmore road";

sqlite3 $STREET_DB "SELECT polyline.id, polyline.line FROM polyline \
  JOIN rtree ON rtree.id = polyline.id \
  JOIN names ON names.id = rtree.id \
  WHERE ( \
    (rtree.minX<$P1 AND rtree.maxX>$P1 AND rtree.minY<$P2 AND rtree.maxY>$P2) OR \
    (rtree.minX<$P3 AND rtree.maxX>$P3 AND rtree.minY<$P4 AND rtree.maxY>$P4) OR \
    (rtree.minX<$P5 AND rtree.maxX>$P5 AND rtree.minY<$P6 AND rtree.maxY>$P6) OR \
    (rtree.minX<$P7 AND rtree.maxX>$P7 AND rtree.minY<$P8 AND rtree.maxY>$P8) \
  ) \
  AND ( (names.name='$NAME') ) LIMIT 5;";
