const microservice_wrapper = require('pelias-microservice-wrapper');
const pelias_config = require('pelias-config').generate();

const LibpostalServiceConfig = class extends microservice_wrapper.ServiceConfiguration {
  constructor(configBlob) {
    super('libpostal', configBlob);
  }
  getUrl(params) {
    return this.baseUrl + params.endpoint;
  }
  getParameters(params) {
    return {
      address: params.address
    };
  }
};

// use the 'services.libpostal' config entry if available, otherwise fall back to 'api.services.libpostal'
const config_entry = pelias_config.get('services.libpostal') || pelias_config.get('api.services.libpostal');

if (!config_entry) {
  throw new Error('Libpostal configuration not found in `services.libpostal` or `api.services.libpostal`');
}

// create an instance of the libpostal service
const libpostal_service = microservice_wrapper.service(
  new LibpostalServiceConfig(config_entry)
);

// create an object that looks like the interface to `node-postal` but uses a remote service
module.exports = {
  expand: {
    expand_address: function(param, callback) {
      const params = {
        endpoint: 'expand',
        address: param
      };

      // the libpostal service will not handle an empty parameter
      // so return empty array immediately
      if (!param) {
        return callback(null, []);
      }
      libpostal_service(params, callback);
    }
  }
};
