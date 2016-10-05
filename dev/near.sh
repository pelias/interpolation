#!/bin/bash

# find all streets near a lat/lon

LON="175.042589";
LAT="-39.9225551";

sqlite3 example/street.db "SELECT DISTINCT polyline.id, polyline.line FROM polyline \
  JOIN rtree ON rtree.id = polyline.id \
  WHERE ( rtree.minX<$LON AND rtree.maxX>$LON AND rtree.minY<$LAT AND rtree.maxY>$LAT )";
