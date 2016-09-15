SELECT street_address.* FROM street_address
JOIN street_rtree ON street_address.id = street_rtree.id
JOIN street_names ON street_names.id = street_rtree.id
JOIN street_polyline ON street_polyline.id = street_rtree.id
WHERE (
  street_rtree.minX<=174.766843 AND street_rtree.maxX>=174.766843 AND
  street_rtree.minY<=-41.288788 AND street_rtree.maxY>=-41.288788
) AND street_names.name = "glasgow street"
ORDER BY street_address.housenumber ASC;
