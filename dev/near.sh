#!/bin/bash

# find all streets near a lat/lon

STREET_DB="/data/street.db";

LON="175.042589";
LAT="-39.9225551";

sqlite3 $STREET_DB "SELECT polyline.id, names.name, polyline.line FROM polyline \
  JOIN rtree ON rtree.id = polyline.id \
  JOIN names ON names.id = polyline.id \
  WHERE ( rtree.minX<$LON AND rtree.maxX>$LON AND rtree.minY<$LAT AND rtree.maxY>$LAT ) \
  GROUP BY polyline.id";
