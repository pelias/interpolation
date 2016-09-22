
module.exports = {
  encode: function( msg, enc ){
    if( Buffer.isBuffer( msg ) ){
      msg = msg.toString('utf8');
    }
    return JSON.stringify( msg ) + '\n';
  },
  decode: function( msg, enc ){
    if( Buffer.isBuffer( msg ) ){
      msg = msg.toString('utf8');
    }
    if( msg.length ){
      // console.error( typeof msg );
      // console.error( '"', msg, '"' );
      // console.error( "---", process.argv[1], "---" );
      // console.error( "-->" );
      // console.error( msg.trim() );
      // console.error( "<--" );
      return JSON.parse( msg );
    }
    return null;
  }
};
