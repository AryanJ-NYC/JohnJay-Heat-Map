const client = require('redis').createClient();

client.on('ready', function () {
  console.log('Redis client ready');
});

// Redis error handler
client.on('error', function (err) {
  console.error('Error: ' + err.message);
});

module.exports = client;
