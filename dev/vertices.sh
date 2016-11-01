#!/bin/bash

# iterate over each street in street.db, joining matching address records

ADDRESS_DB="/data/address.db";
STREET_DB="/data/street.db";

sqlite3 $ADDRESS_DB "ATTACH DATABASE '$STREET_DB' as 'street'; \
  SELECT * FROM street.polyline
  JOIN address ON street.polyline.id = address.id
  WHERE address.source != 'VERTEX'
  GROUP BY address.housenumber
  ORDER BY address.id ASC, address.housenumber ASC";
