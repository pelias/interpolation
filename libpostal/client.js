/*
 * Return the appropriate version of node-postal
 */

const config = require('pelias-config').generate();
const serviceIsConfigured = config.get('services.libpostal') || config.get('api.services.libpostal');

// load the mock library if MOCK_LIBPOSTAL env var is set
if (process.env.MOCK_LIBPOSTAL) {
  module.exports = require('./mock');
}

// else use the HTTP webservice when configured
else if (serviceIsConfigured) {
  module.exports = require('./service');
}

// otherwise use the npm module
else {
  module.exports = require('./module');
}
