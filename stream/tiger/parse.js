
var through = require('through2');

// see: http://www2.census.gov/geo/pdfs/maps-data/data/tiger/tgrshp2016/TGRSHP2016_TechDoc_Ch4.pdf

function streamFactory(){

  var buffer = '';

  return through.obj(function( chunk, _, next ){

    // buffer the whole file
    buffer += chunk.toString('utf8');
    next();

  }, function flush( done ){

    try {

      // parse json
      var collection = JSON.parse( buffer );

      // sort features so that ranges on the same edge group next to each other
      // note: this increases performance by reducing by batching street lookups
      collection.features.sort( function( a, b ){

        // The permanent edge identifier (TLID) attribute
        var edgeA = parseInt( a.properties.TLID, 10 );
        var edgeB = parseInt( b.properties.TLID, 10 );

        // The full street name (eg. "FULLNAME": "Paladino Ave")
        var nameA = a.properties.FULLNAME;
        var nameB = b.properties.FULLNAME;

        // Sort on TLID first
        if(edgeA < edgeB){ return -1; }
        if(edgeA > edgeB){ return 1; }

        // Otherwise sort on FULLNAME
        if(nameA < nameB){ return -1; }
        if(nameA > nameB){ return 1; }

        return 0;
      });

      // push each feature downstream
      collection.features.forEach( function( feat ){
        this.push( feat );
      }, this);

    } catch( e ){
      console.error( 'invalid json', e );
      console.error( buffer );
      process.exit(1);
    }

    done();
  });
}

module.exports = streamFactory;
