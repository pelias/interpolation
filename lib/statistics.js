
var Statistics = function( pluralNoun ){
  this.total = 0;
  this._prev = 0;
  this.timeout = 1000;
  this.pluralNoun = pluralNoun;
};

Statistics.prototype.inc = function( num ){
  if (this.total === 0) {
    console.log(`Time to process first record: ${this.secondsSinceStart()} seconds`);
    this.timeFirstRecordSeen = new Date();
  }
  this.total += num;
};

Statistics.prototype.secondsSinceStart = function() {
  return (new Date().getTime() - this.startTime.getTime()) / 1000;
};

Statistics.prototype.secondsSinceFirstRecord = function() {
  return (new Date().getTime() - this.timeFirstRecordSeen.getTime()) / 1000;
};

Statistics.prototype.print = function(){
  if (this.total === 0) {
    return;
  }
  const rate = this.total / this.secondsSinceFirstRecord();
  console.log(`${this.total.toString().padStart(10)} ${this.pluralNoun} processed (${rate.toFixed(0)}/sec)`);
  this._prev = this.total;
};

Statistics.prototype.start = function() {
  if (!this.isEnabled) {
    this.startTime = new Date();
    this._interval = setInterval( this.print.bind( this ), this.timeout );
    this.isEnabled = true;
  }
};

Statistics.prototype.stop = function() {
  if (this._interval) {
    clearInterval( this._interval );
  }

  if (this.isEnabled) {
    this.print();
    console.log(`Total time to process ${this.total} ${this.pluralNoun}: ${this.secondsSinceStart()} seconds`);
    this.isEnabled = false;
  }
};

module.exports = Statistics;
