const JSFtp = require('jsftp');
const async = require('async');
const path = require('path');
const fs = require('fs-extra');
const unzip = require('unzip');
const logger = require('pelias-logger').get('update_tiger');
const config = require('pelias-config').generate();
const _ = require('lodash');


let TARGET_DIR = _.get(config, 'imports.interpolation.download.tiger.datapath', './data/downloads');
let STATES = _.get(config, 'imports.interpolation.download.tiger.states', []);

if (_.isEmpty(STATES)) {
  STATES = [ {state_code: '', county_code: ''} ];
}

// paddedInt - take an integer/string, return zero padded string
function paddedInt(num, size) {
  let s = num + '';
  while (s.length < size){ s = '0' + s; }
  return s;
}

// iterate over all the desired states, or get all if no states specified
async.eachSeries(STATES, download, (err)=>{
  if (err) {
    logger.error(err);
    process.exit(1);
  }

  process.exit(0);
});

function download(state, callback) {
  const context = {
    ftp: new JSFtp({
      host: 'ftp2.census.gov'
    }),
    stateCode: state.hasOwnProperty('state_code') ? parseInt(state.state_code, 10) : '',
    countyCode: state.hasOwnProperty('county_code') ? parseInt(state.county_code, 10) : '',
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
  let filter = '';
  if( context.stateCode ){
    filter += paddedInt( context.stateCode, 2 );
    if( context.countyCode ){
      filter += paddedInt( context.countyCode, 3 );
    }
  } else {
    if( context.countyCode ){
      logger.error(`county_code specified but state_code is invalid`);
      return callback();
    }
  }
  context.ftp.list(`/geo/tiger/TIGER2016/ADDRFEAT/tl_2016_${filter}*.zip`, (err, res) => {
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
  context.downloadsDir = path.join(TARGET_DIR, 'downloads');
  context.shapefilesDir = path.join(TARGET_DIR, 'shapefiles');

  fs.ensureDirSync(context.downloadsDir);
  fs.ensureDirSync(context.shapefilesDir);

  // must use eachSeries here because the ftp connection only allows one download at a time
  async.eachSeries(context.files, downloadFile.bind(null, context), callback);
}

function downloadFile(context, filename, callback) {
  const localFile = path.join(context.downloadsDir, filename);

  context.ftp.get(`/geo/tiger/TIGER2016/ADDRFEAT/${filename}`, localFile, (err)=> {
    if (err) {
      return callback(err);
    }

    logger.info(`Downloaded ${filename}`);

    // unzip downloaded file
    fs.createReadStream(localFile).pipe(unzip.Extract({ path: context.shapefilesDir })).on('finish', (err) => {
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
