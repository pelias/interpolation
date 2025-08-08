const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const fixtureFile = path.join(__dirname, './fixture/libpostal_responses.json');
let fixtures = require(fixtureFile);

/* When `SEED_MOCK_LIBPOSTAL is set, this library will actually
 * call through to the real libpostal and record the response.
 * In this way the mock responses can be kept up to date as libpostal changes */
const SEED_MOCK_LIBPOSTAL = _.has(process, 'env.SEED_MOCK_LIBPOSTAL');

const expand_address = async (address) => {

  // perform some basic normalization on the address string
  const normalizedAddress = address.trim().toLowerCase();

  // return a mocked response if one is available
  const mockResponse = _.get(fixtures, normalizedAddress);
  if (mockResponse) {
    return Promise.resolve(mockResponse);
  }

  // if no mock response is available but falling back to libpostal service
  // is enabled, and return the real response
  else if (SEED_MOCK_LIBPOSTAL) {
    const service = require('./service');
    const resp = await service.expand.expand_address(normalizedAddress);

    // write the stored list of responses after _every_ new one is added. this is inefficient
    // but it does not appear using `process.on('exit')` is reliable
    fixtures[normalizedAddress] = resp;
    fs.writeFileSync(fixtureFile, JSON.stringify(fixtures, null, 2));

    return Promise.resolve(resp);
  }

  // if there is no mock response and falling back to real libpostal is disabled,
  // throw an error because a human has to run libpostal and find the correct response
  else {
    console.error(`mock libpostal has no response for ${normalizedAddress}`);
    process.exit(1);
  }
};

module.exports.expand = { expand_address };
