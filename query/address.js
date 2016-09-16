
/**

  sql params:

  {
    $lat: 1, // a latitiude within the bbox of the street
    $lon: 1, // a longitude within the bbox of the street
    $name: "foo", // the name of the street ( normalized by libpostal first )
  }

**/

module.exports = function( db, params, cb ){

  var sql = [
    "SELECT street_address.* FROM street_address",
    "JOIN street_rtree ON street_address.id = street_rtree.id",
    "JOIN street_names ON street_names.id = street_rtree.id",
    "JOIN street_polyline ON street_polyline.id = street_rtree.id",
    "WHERE (",
      "street_rtree.minX<=$lon AND street_rtree.maxX>=$lon AND",
      "street_rtree.minY<=$lat AND street_rtree.maxY>=$lat",
    ")",
    "AND street_names.name = $name",
    "ORDER BY street_address.housenumber ASC;"
  ].join(' ');

  db.all( sql, params, cb );
};
