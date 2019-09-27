const async = require('async');
const path = require('path');
const fs = require('fs-extra');
const unzip = require('unzip');
const logger = require('pelias-logger').get('interpolation(TIGER)');
const config = require('pelias-config').generate();
const _ = require('lodash');

const CensusS3Mirror = require('./adapter/CensusS3Mirror');
const adapter = new CensusS3Mirror();

let TARGET_DIR = _.get(config, 'imports.interpolation.download.tiger.datapath', './data/downloads');
let STATES = _.get(config, 'imports.interpolation.download.tiger.states', []);

if (_.isUndefined(_.get(config, 'imports.interpolation.download.tiger'))) {
  logger.warn('pelias.json has no \'imports.interpolation.download.tiger\' section, quitting');
  process.exit(0);
}

if (_.isEmpty(STATES)) {
  logger.info('downloading all TIGER data');
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
  adapter.list(`tl_2016_${filter}*.zip`, (err, files) => {
    if (err) { return callback(err); }
    logger.info(`Queuing ${files.length} downloads`);
    context.files = files;
    callback();
  });
}

function downloadFilteredFiles(context, callback) {
  context.downloadsDir = path.join(TARGET_DIR, 'downloads');
  context.shapefilesDir = path.join(TARGET_DIR, 'shapefiles');

  // ensure directories exist
  fs.ensureDirSync(context.downloadsDir);
  fs.ensureDirSync(context.shapefilesDir);

  // ensure directories are writable
  fs.accessSync(context.downloadsDir, fs.constants.R_OK | fs.constants.W_OK);
  fs.accessSync(context.shapefilesDir, fs.constants.R_OK | fs.constants.W_OK);

  // must use eachSeries here because the ftp connection only allows one download at a time
  async.eachSeries(context.files, downloadFile.bind(null, context), callback);
}

function downloadFile(context, filename, callback) {
  const localFile = path.join(context.downloadsDir, filename);

  adapter.get(filename, localFile, (err) => {
    logger.info(`Downloading ${filename}`);
    if (err) { return callback(err); }
    logger.debug(`Downloaded ${filename}`);

    // record unzip errors
    let unzipError = null;

    // decompress files to shapefile directory
    const decompress = unzip.Extract({ path: context.shapefilesDir });
    decompress.on('error', (err) => {
      unzipError = err;
      logger.error(`Failed to unzip ${filename}`);
      logger.error(err);
    });

    // unzip downloaded file
    logger.info(`Decompressing ${filename}`);
    fs.createReadStream(localFile)
      .pipe(decompress)
      .on('finish', () => {
        logger.debug(`Decompressed ${filename}`);

        // delete zip file after unzip is done
        fs.unlinkSync(localFile);

        // return unzip error if one occurred
        callback(unzipError);
      });
  });
}
