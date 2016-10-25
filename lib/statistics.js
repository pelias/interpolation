
var Statistics = function(){
  this.total = 0;
  this._prev = 0;
  this.timeout = 1000;
};

Statistics.prototype.inc = function( num ){
  this.total += num;
};

Statistics.prototype.print = function(){
  console.log( this.total + '\t' + ( this.total - this._prev ) + '/sec' );
  this._prev = this.total;
};

Statistics.prototype.tick = function( isEnabled ){
  clearInterval( this._interval );
  if( false !== isEnabled ){
    this._interval = setInterval( this.print.bind( this ), this.timeout );
  } else {
    this.print();
  }
};

module.exports = Statistics;
