let postal;

// lazy-load node-postal only as required
const lazy = () => {
  if(!postal){ postal = require('node-postal'); }
  return postal;
};

const expand_address = async (address) => {
  // return empty array immediately for empty input
  if (!address) { return Promise.resolve([]); }

  const resp = lazy().expand.expand_address(address);
  return Promise.resolve(resp);
};

module.exports.expand = { expand_address };
