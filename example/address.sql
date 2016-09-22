SELECT street_address.* FROM street_rtree
JOIN street_address ON street_address.id = street_rtree.id
JOIN street_names ON street_names.id = street_rtree.id
WHERE (
  street_rtree.minX<=-73.9981 AND street_rtree.maxX>=-73.9981 AND
  street_rtree.minY<=40.747625 AND street_rtree.maxY>=40.747625
) AND street_names.name = "west 26 street"
ORDER BY street_address.housenumber ASC;
