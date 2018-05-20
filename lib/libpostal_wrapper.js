const mock_libpostal = require('../test/lib/mock_libpostal');

// This module is a wrapper around the actual libpostal service library
// and the mock libpostal library
// it allows an environment variable to switch which library is used in application code

let libpostal_module;
function get_libpostal() {
  // return the mock library if MOCK_LIBPOSTAL env var is set
  if (process.env.MOCK_LIBPOSTAL) {
    return mock_libpostal;
  // otherwise return the actual service
  } else {
    // lazy load the libpostal module so that tests can skip configuring the service
    if (!libpostal_module) {
      libpostal_module = require( '../libpostal/service' );
    }
    return libpostal_module;
  }
}

module.exports = get_libpostal;
