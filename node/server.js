// include 'express' - a web framework for Node
const express = require('express'),
      app = express(),
      mySqlDB = require('./config/databases/mySqlConnection.js'),
      mySqlConnectionPool = mySqlDB.connectionPool,
      port = process.env.PORT || 8000;

// utility to read and write to files
var fs = require('fs');

var path = require('path');
var request = require('request');

// utility for asynchronous operations
var async = require('async');

// include middleware for parsing json
var bodyParser = require('body-parser');
app.use(bodyParser.json());

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: { message: err.message }});
});

// use this directory to serve static files
app.use(express.static('public'));

app.use('/node/data', express.static('node/data'));

// scripts
var nodeDir = __dirname + '/../node_modules';
var appDir = __dirname + '/../public/app/assets/js';
app.use('/scripts', express.static(nodeDir + '/jquery/dist/'));
app.use('/scripts', express.static(nodeDir + '/angular'));
app.use('/scripts', express.static(nodeDir + '/angular-animate'));
app.use('/scripts', express.static(nodeDir + '/angular-aria'));
app.use('/scripts', express.static(nodeDir + '/angular-messages'));
app.use('/scripts', express.static(nodeDir + '/angular-leaflet-directive/dist'));
app.use('/scripts', express.static(nodeDir + '/angular-daterangepicker/js'));
app.use('/scripts', express.static(nodeDir + '/bootstrap/dist/js'));

// styles
app.use('/styles', express.static(nodeDir + '/bootstrap/dist/css'));
app.use('/styles', express.static(nodeDir + '/font-awesome'));

// scripts and styles
app.use('/assets', express.static(nodeDir + '/bootstrap-daterangepicker'));
app.use('/assets', express.static(nodeDir + '/bootstrap-colorpicker/dist'));
app.use('/assets', express.static(nodeDir + '/leaflet/dist'));
app.use('/assets', express.static(appDir));

const routes = require('./routes/routes');
app.use('/api', routes);

// get rooms data
app.post('/api/v1/rooms-data', function (req, res) {
    var roomData = {};
    var count = 0;
    var url = 'node/data/' + req.body.floorLevel;

    fs.readFile(url + '/vavs.json', 'utf-8', function (err, data) {
      var vavs = Object.keys(JSON.parse(data)); // ['47101, 47102, ...']

      async.whilst(
        function () {
          return count < vavs.length;
        },

        function (callback) {
          fs.readFile(url + '/inside_temp/Room' + vavs[count] + '.csv', 'utf-8', function (err, data) {
            if (err) {
                console.log(err);
            } else {

              // [date1, temp1, date2, temp2, ...]
              var listData = data.split(',').map(function (i) {
                return i.trim()
              });

              // {date1: temp1, date2: temp2, ...]
              var floorData = {};
              for (var i = 0; i < listData.length - 1; i += 2) {
                floorData[listData[i]] = listData[i + 1];
              }

              roomData[vavs[count]] = floorData;
            }

            count++;
            callback();
          });
        },

        function () {
          res.send(roomData);
        }
      );
    });
});

// route to get room coordinates and vavs
app.post('/api/v1/coordinates', function (req, res) {
    var url = 'node/data/' + req.body.floorLevel;
    fs.readFile(url + '/room_coordinates.json', 'utf-8', function (err, data) {
        var roomCoordinates = JSON.parse(data);

        fs.readFile(url + '/vavs.json', 'utf-8', function (err, data) {
            var vavs = JSON.parse(data);
            res.send({'roomCoordinates': roomCoordinates, 'vavs': vavs});
        });
    });
});

// get weather data
app.get('/api/v1/weather-data', function (req, res) {
  fs.readFile('node/data/weather-data/weather.json', 'utf-8', function (err, data) {
    res.send(data);
  });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/index'))
});

app.listen(port, function () {
  console.log(`App running on port: ${port}`);
});

process.on('SIGTERM', function () {
  mySqlConnectionPool.end(function () {
    console.log('Connection to mySqlDB terminated.');
  });
});
