'use strict';

const _ = require('lodash');

let real_libpostal;

/* uncomment this to actually use libpostal to print out all the responses.
 * This can be useful for filling in new responses.
 * Changing this to true should not be committed. */
const use_real_libpostal = false;

// put all desired responses from libpostal here
let mock_responses = require('../../test/lib/mock_libpostal_responses');

module.exports.expand = {
  expand_address:function(input_string) {
    const clean_string = input_string.trim().toLowerCase();
    // return a mocked response if one is available
    if (_.has(mock_responses, clean_string)) {
      return mock_responses[clean_string];
    // if no mock response is available but falling back to real libpostal
    // is enabled, lazy load real libpostal, and return the real response
    } else if (use_real_libpostal) {
      // lazy load libpostal only when needed
      if (!real_libpostal) { real_libpostal = require('node-postal'); }

      const real_response = real_libpostal.expand.expand_address(clean_string);
      mock_responses[clean_string] = real_response;

      return real_response;
    // if there is no mock response and falling back to real libpostal is disabled,
    // throw an error because a human has to run libpostal and find the correct response
    } else {
      console.error(`mock libpostal has no response for ${clean_string}`);
      process.exit(1);
    }
  }
};

/* if using libostal to generate mock data, print the final state of the mock responses on exit */
if (use_real_libpostal) {
  process.on('exit', function() {
    console.log('quitting');
    console.log(JSON.stringify(mock_responses, null, 2));
  });
}