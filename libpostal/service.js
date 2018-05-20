// deasync is used to proved a sync-looking interface
// to the async call to the libpostal service
const deasync = require('deasync');
const microservice_wrapper = require('pelias-microservice-wrapper');
const pelias_config = require('pelias-config').generate();

if (!pelias_config.services || !pelias_config.services.libpostal || !pelias_config.services.libpostal.url) {
  throw new Error('The URL to the libpostal service must be set in the services.libpostal.url property of pelias.json');
}

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

// create an instance of the libpostal service, with a synchronous interface
const libpostal_service = deasync(microservice_wrapper.service(
  new LibpostalServiceConfig(pelias_config.services.libpostal)
));

// create an object that looks like the interface to `node-postal` but uses a remote service
module.exports = {
  expand: {
    expand_address: function(param) {
      const params = {
        endpoint: 'expand',
        address: param
      };

      // the libpostal service will not handle an empty parameter
      // so return empty array immediately
      if (!param) {
        return [];
      }
      const result = libpostal_service(params);
      return result;
    }
  }
};
