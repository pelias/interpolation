
-- basic rtree lookup
SELECT id FROM street_rtree
 WHERE minX<=174.766843 AND maxX>=174.766843
   AND minY<=-41.288788  AND maxY>=-41.288788;

-- full rtree + lingusitic match
SELECT street_polyline.id, street_names.name, street_polyline.line FROM street_rtree
JOIN street_names ON street_names.id = street_rtree.id
JOIN street_polyline ON street_polyline.id = street_rtree.id
WHERE (
  street_rtree.minX<=174.766843 AND street_rtree.maxX>=174.766843 AND
  street_rtree.minY<=-41.288788 AND street_rtree.maxY>=-41.288788
) AND street_names.name = "glasgow street";

-- example of using a geometry table
-- SELECT street_names.name, Boundary(street_geometry.geometry) FROM street_rtree
-- JOIN street_names ON street_names.id = street_rtree.id
-- JOIN street_geometry ON street_geometry.id = street_rtree.id
-- WHERE ( minX<=174.766843 AND maxX>=174.766843 AND minY<=-41.288788 AND maxY>=-41.288788 )
-- AND street_names.name = "glasgow street";
