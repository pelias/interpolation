
var split = require('split2'),
    through = require('through2');

var geojson = {
  'type': 'FeatureCollection',
  'features': []
};

function parser( line, _, next ){

  var json = JSON.parse( line );

  if( json.type === 'node' ){
    geojson.features.push({
      'type': 'Feature',
      'properties': json,
      'geometry': {
        'type': 'Point',
        'coordinates': [ parseFloat( json.lon ), parseFloat( json.lat ) ]
      }
    });
  }
  else if( json.type === 'way' ){
    geojson.features.push({
      'type': 'Feature',
      'properties': json,
      'geometry': {
        'type': 'LineString',
        'coordinates': json.nodes.map( function( node ){
          return [ parseFloat( node.lon ), parseFloat( node.lat ) ];
        })
      }
    });
  }

  next();
}

function flush(){
  console.log( JSON.stringify( geojson, null, 2 ) );
}

process.stdin.pipe( split() )
             .pipe( through( parser, flush ) );
