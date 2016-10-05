
var chalk = require('chalk');
var coerse = {};

/**
  convenience functions for validating args of cli commands
**/

coerse.help = function(){
}

coerse.fail = function( arg, message ){
  console.error( chalk.red( "\n[" + arg + "]", message ) );
  coerse.help();
  process.exit(1);
}

coerse.memoize = function( arg, path ){
  var memo = {};
  memo[arg] = path;
  return memo;
}

coerse.reduce = function( memo, memo2 ){
  for( var attr in memo2 ){
    memo[attr] = memo2[attr];
  }
  return memo;
}

coerse.map = function( cmds ){
  var memo = {};
  cmds.forEach( function( cmd ){
    memo = coerse.merge( memo, cmd() );
  });
  return memo;
}

coerse.dbpath = function( arg, path ){
  if( 'string' !== typeof path || !path.length ){
    coerse.fail( arg, "invalid database path" );
  }
  return coerse.memoize( arg, path );
}

coerse.name = function( arg, name ){
  if( 'string' !== typeof name || !name.length ){
    coerse.fail( arg, "invalid name" );
  }
  return coerse.memoize( arg, name );
}

coerse.lat = function( arg, lat ){
  var fl = parseFloat(lat);
  if( isNaN(fl) || fl < -90 || fl > +90 ){
    coerse.fail( arg, "invalid latitude" );
  }
  return coerse.memoize( arg, lat );
}

coerse.lon = function( arg, lon ){
  var fl = parseFloat(lon);
  if( isNaN(fl) || fl < -180 || fl > +180 ){
    coerse.fail( arg, "invalid longitude" );
  }
  return coerse.memoize( arg, lon );
}

module.exports = coerse;
