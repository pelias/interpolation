const fs = require('fs');
const path = require('path');
const request = require('superagent');
const cheerio = require('cheerio');
const conform = /^tl_2016_(\d{5})_addrfeat\.zip$/;

class CensusS3Mirror {
  constructor() {
    this.host = 'https://census-backup.s3.amazonaws.com';
    this.prefix = '/tiger/2016/ADDRFEAT';
  }
  list(pattern, cb) {

    // convert glob-style pattern to regex
    let regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

    request
      .get(`${this.host}${this.prefix}/index.html`)
      .set('accept', 'text/html')
      .end((err, res) => {
        if (err) { return cb(err); }
        if (res.status >= 400){ return cb(`status code: ${res.status}`); }

        // parse HTML
        const $ = cheerio.load(res.text);
        let links = $('a').map(function (i) {
          return $(this).attr('href');
        }).get();

        // remove path prefixes
        links = links.map(l => path.basename(l));

        // filter by regex (to remove any other links on the page)
        links = links.filter(l => conform.test(l));

        // apply pattern filter
        links = links.filter(l => regex.test(l));

        cb(null, links);
      });
  }
  get(remoteFileName, localFilePath, cb) {
    const sink = fs.createWriteStream(localFilePath);
    sink.on('finish', () => cb());

    // download remote file to local file path
    request
      .get(`${this.host}${this.prefix}/${remoteFileName}`)
      .on('error', (error) => cb(error))
      .pipe(sink);
  }
}

module.exports = CensusS3Mirror;