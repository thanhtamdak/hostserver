// workers/createWorker.js
const mediasoup = require('mediasoup');
const mediasoupConfig = require('./mediasoupConfig');

module.exports = async function createWorker() {
  const worker = await mediasoup.createWorker(mediasoupConfig.worker);
  worker.on('died', () => {
    console.error('mediasoup worker died, restarting...');
    process.exit(1);
  });
  return worker;
};
