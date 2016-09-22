SELECT address.* FROM address
JOIN street.rtree ON address.id = street.rtree.id
JOIN street.names ON street.names.id = street.rtree.id
JOIN street.polyline ON street.polyline.id = street.rtree.id
WHERE (
  street.rtree.minX<=174.766843 AND street.rtree.maxX>=174.766843 AND
  street.rtree.minY<=-41.288788 AND street.rtree.maxY>=-41.288788
) AND street.names.name = "glasgow street"
ORDER BY address.housenumber ASC;
