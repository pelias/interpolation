const util = require('util');
const pmw = require('pelias-microservice-wrapper');
const LibpostalServiceConfig = require('./LibpostalServiceConfig');
const config = require('pelias-config').generate();

// use the 'services.libpostal' config entry if available, otherwise fall back to 'api.services.libpostal'
const serviceConfig = config.get('services.libpostal') || config.get('api.services.libpostal');
if (!serviceConfig) {
  throw new Error('Libpostal configuration not found in `services.libpostal` or `api.services.libpostal`');
}

// create a service
const service = pmw.service(new LibpostalServiceConfig(serviceConfig));

// create an object that looks like the interface to `node-postal` but uses a remote service
module.exports = {
  expand: {
    expand_address: async function (address) {

      // the libpostal service will not handle an empty address
      // string, so return empty array immediately
      if (!address) { return Promise.resolve([]); }

      const promise = util.promisify(service);
      return promise({
        endpoint: 'expand',
        address
      });
    }
  }
};
