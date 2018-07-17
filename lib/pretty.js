
var Table = require('cli-table3');

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

  var json = {
    'type': 'FeatureCollection',
    'features': []
  };

  // valid results
  if( Array.isArray(res) && res.length ){

    // all address points
    res.forEach( function( row ){
      if( row.source === 'VERTEX' ){
        json.features.push( geojson.point( row, row.proj_lon, row.proj_lat ) );
      } else {
        json.features.push( geojson.point( row, row.lon, row.lat ) );
      }
    });

    // interpolated lines
    res.filter( function( row ){
      return row.source !== 'VERTEX';
    }).forEach( function( row ){
      json.features.push( geojson.line( { parity: row.parity }, row.lon, row.lat, row.proj_lon, row.proj_lat ) );
    });
  }

  return json;
}

geojson.point = function( props, lon, lat ){

  var p = {
    'type': 'Feature',
    'properties': props,
    'geometry': {
      'type': 'Point',
      'coordinates': [ lon, lat ]
    }
  };

  if( props.source === 'VERTEX' ){
    p.properties['marker-size'] = 'small';
    p.properties['marker-color'] = '#ffa500'; // orange
  } else {

    // parity
    if( props.parity === 'L' ){
      p.properties['marker-color'] = '#3366ff'; // blue
    } else if( props.parity === 'R' ){
      p.properties['marker-color'] = '#ff0000'; // red
    }

    // is even
    if( 'housenumber' in props ){
      if( 0 === (parseInt( props.housenumber, 10 ) %2) ){
        p.properties['marker-symbol'] = 'e';
      } else {
        p.properties['marker-symbol'] = 'o';
      }
    }
  }

  return p;
};

geojson.line = function( props, p1Lon, p1Lat, p2Lon, p2Lat ){

  var p = {
    'type': 'Feature',
    'properties': props,
    'geometry': {
      'type': 'LineString',
      'coordinates': [
        [ p1Lon, p1Lat ],
        [ p2Lon, p2Lat ]
      ]
    }
  };

  // parity
  if( props.parity === 'L' ){
    p.properties.stroke = '#3366ff'; // blue
  } else if( props.parity === 'R' ){
    p.properties.stroke = '#ff0000'; // red
  }

  return p;
};

function htmltable( res ){

  var keys = Object.keys(res[0]);
  var table = '<tr><th>' + keys.join('</th><th>') + '</th></tr>';

  res.forEach( function( row ){
    table += '<tr>';
    keys.forEach( function( key ){
      table += '<td style="padding: 2px 5px;">' + ( row[ key ] || '' ) + '</td>';
    });
    table += '</tr>';
  });

  var attrs = 'border="1" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"';

  return '<html><body><table ' + attrs + '>' + table + '</table></body></html>';
}

module.exports.table = table;
module.exports.geojson = geojson;
module.exports.htmltable = htmltable;
