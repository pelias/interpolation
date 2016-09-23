
var Table = require('cli-table2');

/**
  convenience functions for pretty printing results from 'search.js'.
**/

// print a pretty table of results
function table( res ){

  // invalid results
  if( !Array.isArray(res) || !res.length ){ return; }

  var table = new Table({
    head: Object.keys( res[0] )
  });

  res.forEach( function( row ){
    var vals = [];
    for( var attr in row ){
      vals.push( row[attr] || '' );
    }
    table.push( vals );
  });

  return table.toString();
}

// print results as geojson
function geojson( res ){

  var point = function( row ){

    var props = {};
    for( var attr in row ){
      if( row[attr] ){ props[attr] = row[attr]; }
    }

    var p = {
      "type": "Feature",
      "properties": props,
      "geometry": {
        "type": "Point",
        "coordinates": [
          row.source === 'OA' ? row.lon : row.proj_lon,
          row.source === 'OA' ? row.lat : row.proj_lat
        ]
      }
    };

    if( row.source === 'VERTEX' ){
      p.properties['marker-color'] = "FFA500";
    }

    return p;
  };

  var json = {
    "type": "FeatureCollection",
    "features": []
  };

  // invalid results
  if( Array.isArray(res) && res.length ){
    res.forEach( function( row ){
      json.features.push( point( row ) );
    });
  }

  return JSON.stringify( json, null, 2 );
}


module.exports.table = table;
module.exports.geojson = geojson;
