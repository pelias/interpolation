
/**

  sql params:

  {
    $lat: 1, // a latitiude within the bbox of the street
    $lon: 1, // a longitude within the bbox of the street
    $name: "foo", // the name of the street ( normalized by libpostal first )
  }

  SELECT address.* FROM street.rtree
  JOIN street.names ON street.names.id = street.rtree.id
  JOIN address ON address.id = street.rtree.id
  WHERE (
    street.rtree.minX<=174.766843 AND street.rtree.maxX>=174.766843 AND
    street.rtree.minY<=-41.288788 AND street.rtree.maxY>=-41.288788
  ) AND street.names.name = "glasgow street";

**/

module.exports = function( db, params, cb ){

  var sql = [
    "SELECT address.* FROM street.rtree",
    "JOIN street.names ON street.names.id = street.rtree.id",
    "JOIN address ON address.id = street.rtree.id",
    "WHERE ",
    "street.rtree.minX<=$lon AND street.rtree.maxX>=$lon AND",
    "street.rtree.minY<=$lat AND street.rtree.maxY>=$lat AND",
    "street.names.name = $name",
    "ORDER BY address.housenumber ASC;"
  ].join(' ');

  db.all( sql, params, cb );
};
