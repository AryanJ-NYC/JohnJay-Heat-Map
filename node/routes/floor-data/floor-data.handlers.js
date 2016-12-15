'use strict';
const async = require('async'),
      request = require('request'),
      squel = require('squel'),
      mySqlDB = require('../../config/databases/mySqlConnection'),
      mySqlConnectionPool = mySqlDB.connectionPool,
      redisClient = require('../../config/databases/redisConnection');

module.exports.getVavsByFloor = function (req, res, next, floorNumber) {
  const sensorQuery = squel.select()
        .from('sensors')
        .where(`sensorfloor = ${floorNumber} AND sensortype IN ('VAV', 'FPB') AND sensor_deviceid != ''`)
        .field('sensor_deviceid')
        .field('sensorid')
        .field('sensorname')
        .toString();

  mySqlConnectionPool.getConnection(function (err, connection) {
    if (err) console.error('Unable to get connection: ' + err.message);
    if (connection) {
      console.log('Connected to MySQL DB');
      connection.query(sensorQuery, function (err, rows) {
        if (err) console.error(err);

        // for each query result, get data from cache or request data from API
        async.mapLimit(rows, 50,
            function (vav, callback) {
              redisClient.hgetall(vav.sensorid, function (err, vavData) {
                if (err) console.error(`Error retrieving Redis data:\n${err}`);

                // no cache hit
                if (!vavData) {
                  request.get(`http://bpl.dev.cisdd.org/api/sensors/${vav.sensorid}`, function (err, res, body) {
                    let sensorType;
                    if (vav.sensorname.indexOf('DMPR POS') > 0) {
                      sensorType = 'Damper Position';
                    } else if (vav.sensorname.indexOf('DIAL') > 0) {
                      sensorType = 'Room Setpoint';
                    } else if (vav.sensorname.indexOf('ROOM TEMP') > 0) {
                      sensorType = 'Room Temperature';
                    }

                    try {
                      body = JSON.parse(body);
                    } catch (error) {
                      console.error(error.message);
                      return callback();
                    }
                    if (!body.data) {
                      console.log(body);
                      return callback()
                    }

                    const vavObject = {
                      sensorId: vav.sensorid,
                      sensorDeviceId: vav.sensor_deviceid,
                      sensorType: sensorType
                    };

                    let data = {};
                    body.data.forEach(function (datum) {
                      redisClient.hset(vavObject.sensorId, datum.date, datum.value);
                      data[datum.date] = datum.value;
                    });
                    vavObject.data = data;
                    redisClient.hset(vavObject.sensorId, 'sensorType', vavObject.sensorType);
                    redisClient.hset(vavObject.sensorId, 'sensorDeviceId', vavObject.sensorDeviceId);

                    return callback(null, vavObject);
                  });
                }

                // get data from Redis cache
                else {
                  let data = {};

                  // format data in correct format
                  for (let key in vavData) {
                    if (key != 'sensorDeviceId' && key != 'sensorType') {
                      data[key] = vavData[key];
                    }
                  }

                  const vavObject = {
                    sensorId: vav.sensorid,
                    sensorDeviceId: vavData.sensorDeviceId,
                    sensorType: vavData.sensorType,
                    data: data
                  };
                  return callback(null, vavObject);
                }
              });
            },
            function (err, vavs) {
              if (err) {
                console.error(`Error in async map callback: ${err.message}`);
              }
              connection.release(function () {
                console.log('MySQL DB connection released.');
              });
              req.vavs = Array.from(new Set(vavs));
              return next();
            });
      });
    }
  });
};
