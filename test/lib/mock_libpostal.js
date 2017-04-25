'use strict';

const _ = require('lodash');

let real_libpostal;

/* uncomment this to actually use libpostal to print out all the responses.
 * This can be useful for filling in new responses.
 * Changing this to true should not be committed. */
const use_real_libpostal = false;

module.exports.expand = {
  expand_address:function(input_string) {
    // return a mocked response if one is available
    if (_.has(mock_responses, input_string)) {
      return mock_responses[input_string];
    // if no mock response is available but falling back to real libpostal
    // is enabled, lazy load real libpostal, print the new mock response set,
    // and return the real response
    } else if (use_real_libpostal) {
      // lazy load libpostal only when needed
      if (!real_libpostal) { real_libpostal = require('node-postal'); }

      const real_response = real_libpostal.expand.expand_address(input_string);
      mock_responses[input_string] = real_response;
      console.log('new mock_responses:');
      console.log(JSON.stringify(mock_responses, null, 2));

      return real_response;
    // if there is no mock response and falling back to real libpostal is disabled,
    // throw an error because a human has to run libpostal and find the correct response
    } else {
      console.error(`mock libpostal has no response for ${input_string}`);
      process.exit(1);
    }
  }
};

// update this object with responses from libpostal
const mock_responses = {
  grolmanstraße: [
    'grolmanstrasse',
    'grolman strasse'
  ],
  'West 26th st': [
    'west 26th street',
    'west 26th saint'
  ],
  '': [
    ''
  ]
};
