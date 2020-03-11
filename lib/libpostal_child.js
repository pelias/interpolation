const bus = require('ipc-messages-manager').child;
const isMock = process.env.hasOwnProperty('MOCK_LIBPOSTAL');
const moduleName = isMock ? '../test/lib/mock_libpostal' : 'node-postal';
let postal;

function blockUntilModuleLoaded(){
  if (!postal) {
    postal = require(moduleName);
    console.log('libpostal child process ready');
  }
}

bus.actions.on('expand.expand_address', (args, cb) => {
  blockUntilModuleLoaded();
  const expanded = postal.expand.expand_address(args.address, args.options);
  cb(expanded);
});

console.log('libpostal child process connected');
