const ServiceConfiguration = require('pelias-microservice-wrapper').ServiceConfiguration;

class LibpostalServiceConfig extends ServiceConfiguration {
  constructor(config) {
    super('libpostal', config);
  }
  getUrl(params) {
    return this.baseUrl + params.endpoint;
  }
  getParameters(params) {
    return {
      address: params.address
    };
  }
}

module.exports = LibpostalServiceConfig;
