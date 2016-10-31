#!/bin/bash

# interate over each street in streetdb, joining matching address records

# ADDRESS_DB="/data/address.db";
# STREET_DB="/data/street.db";

ADDRESS_DB="test/functional/updown/address.db";
STREET_DB="test/functional/updown/street.db";

sqlite3 $ADDRESS_DB "ATTACH DATABASE '$STREET_DB' as 'street'; \
  SELECT * FROM street.polyline
  JOIN address ON street.polyline.id = address.id
  WHERE address.source != 'VERTEX'
  GROUP BY address.housenumber
  ORDER BY address.id ASC, address.housenumber ASC";
