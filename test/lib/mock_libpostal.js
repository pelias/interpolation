const _ = require('lodash');
const fs = require('fs');

// the real libpostal module, if needed will be loaded here
let real_libpostal;

/* When `SEED_MOCK_LIBPOSTAL is set, this library will actually
 * call through to the real libpostal and record the response.
 * In this way the mock responses can be kept up to date as libpostal changes */
const use_real_libpostal = process.env.SEED_MOCK_LIBPOSTAL !== undefined;

// put all desired responses from libpostal here
let mock_responses = require('../../test/lib/mock_libpostal_responses');

module.exports.expand = {
  expand_address: function(input_string, callback) {
    const clean_string = input_string.trim().toLowerCase();
    // return a mocked response if one is available
    if (_.has(mock_responses, clean_string)) {
      return setImmediate(() => {
        callback(null, mock_responses[clean_string]);
      });
    // if no mock response is available but falling back to real libpostal
    // is enabled, lazy load real libpostal, and return the real response
    } else if (use_real_libpostal) {
      // lazy load libpostal only when needed
      if (!real_libpostal) { real_libpostal = require('../../libpostal/service'); }

      real_libpostal.expand.expand_address(clean_string, function(err, real_response, metadata) {
        if (err) {
          throw err;
        }
        mock_responses[clean_string] = real_response;

        // write the stored list of responses after _every_ new one is added. this is inefficient
        // but it does not appear using `process.on('exit')` is reliable
        fs.writeFileSync(__dirname +'/../../test/lib/mock_libpostal_responses.json', JSON.stringify(mock_responses, null, 2));

        return callback(null, real_response, metadata);
      });
    // if there is no mock response and falling back to real libpostal is disabled,
    // throw an error because a human has to run libpostal and find the correct response
    } else {
      console.error(`mock libpostal has no response for ${clean_string}`);
      process.exit(1);
    }
  }
};
