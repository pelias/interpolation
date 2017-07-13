'use strict';

const JSFtp = require('jsftp');
const async = require('async');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const logger = require('pelias-logger').get('update_tiger');


download((err)=>{
  if (err) {
    logger.error(err);
    process.exit(1);
  }

  process.exit(0);
});

function download(callback) {
  const context = {
    ftp: new JSFtp({
      host: 'ftp2.census.gov'
    }),
    stateCode: process.env.STATE_CODE || '',
    targetDir: process.env.TIGERPATH || './data/downloads/',
    files: []
  };

  async.series(
    [
      // get a list of relevant filenames
      getFilteredFileList.bind(null, context),
      // download all identified files, upzip, remove zip
      downloadFilteredFiles.bind(null, context)
    ],
    (err) => {
      if (err) {
        logger.error(err);
      }
      callback(err);
    });
}

function getFilteredFileList(context, callback) {
  // note that if context.stateCode is an empty string, all files will be listed
  context.ftp.list(`/geo/tiger/TIGER2016/ADDRFEAT/tl_2016_${context.stateCode}*.zip`, (err, res) => {
    if (err) {
      return callback(err);
    }

    // output of the list command looks like a typical ls command in unix
    // this line will split the output into lines, and from each line grab the end of the file
    // (all filenames are fixed length 27 chars)
    // then it will trim the names and filter out any empty ones
    context.files = res.split('\n').map((file)=>(file.substr(-27).trim())).filter((file)=>(file.length > 0));

    callback();
  });
}

function downloadFilteredFiles(context, callback) {
  // must use eachSeries here because the ftp connection only allows one download at a time
  async.eachSeries(context.files, downloadFile.bind(null, context), callback);
}

function downloadFile(context, filename, callback) {
  const localFile = path.join(context.targetDir, filename);

  context.ftp.get(`/geo/tiger/TIGER2016/ADDRFEAT/${filename}`, localFile, (err)=> {
    if (err) {
      return callback(err);
    }

    logger.info(`Downloaded ${filename}`);

    // unzip downloaded file
    fs.createReadStream(localFile).pipe(unzip.Extract({ path: context.targetDir })).on('finish', (err) => {
      if (err) {
        logger.error(`Failed to unzip ${filename}`);
        return callback(err);
      }

      // delete zip file after unzip is done
      fs.unlinkSync(localFile);
      callback();
    });
  });
}
