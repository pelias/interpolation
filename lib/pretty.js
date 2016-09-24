
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
// @see: https://help.github.com/articles/mapping-geojson-files-on-github/
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
      p.properties['marker-size'] = 'small';
      p.properties['marker-color'] = "#ffa500"; // orange
    } else {

      // parity
      if( row.parity === 'L' ){
        p.properties['marker-color'] = "#3366ff"; // blue
      } else if( row.parity === 'R' ){
        p.properties['marker-color'] = "#ff0000"; // red
      }

      // is even
      if( 0 === (parseInt( row.housenumber, 10 ) %2) ){
        p.properties['marker-symbol'] = "e";
      } else {
        p.properties['marker-symbol'] = "o";
      }
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
