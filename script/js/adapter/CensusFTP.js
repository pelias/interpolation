const JSFtp = require('jsftp');

class CensusFTP {
  constructor(){
    this.client = new JSFtp({ host: 'ftp2.census.gov' });
    this.prefix = '/geo/tiger/TIGER2016/ADDRFEAT';
  }
  list(pattern, cb){
    this.client.list(`${this.prefix}/${pattern}`, (err, res) => {
      if (err) { return cb(err); }
      // output of the list command looks like a typical ls command in unix
      // this line will split the output into lines, and from each line grab the end of the file
      // (all filenames are fixed length 27 chars)
      // then it will trim the names and filter out any empty ones
      let files = res.split('\n').map((file) => (file.substr(-27).trim())).filter((file) => (file.length > 0));

      cb(null, files);
    });
  }
  get(remoteFileName, localFilePath, cb){
    this.client.get(`${this.prefix}/${remoteFileName}`, localFilePath, cb);
  }
}

module.exports = CensusFTP;