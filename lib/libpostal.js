const util = require('util');
const child = require('child_process');
const child_script = require('path').join(__dirname, './libpostal_child.js');
const bus = require('ipc-messages-manager').parent;
const stdio = ['inherit', 'inherit', 'inherit', 'ipc'];

// spawn child process
const proc = child.spawn('node', [child_script], { stdio });

// log subprocess errors
proc.on('error', (e) => console.error(e));

// specify 'expand_address' IPC API
function expand_address_ipc (address, options, cb) {
  bus.send(proc, 'expand.expand_address', { address, options }, (res) => cb(null, res));
}

// specify 'expand_address' async API
const expand_address_async = async function(address) {
  const promise = util.promisify(expand_address_ipc);
  return promise(address, {});
};

module.exports = {
  close: () => {
    proc.disconnect();
    proc.kill();
  },
  expand: {
    expand_address: expand_address_async
  }
};
