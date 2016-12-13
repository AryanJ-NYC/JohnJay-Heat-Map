'use strict';
const router = require('express').Router(),
      sensorHandlers = require('./sensor.handlers');

router.get('/:sensorId', sensorHandlers.getSensorData);

module.exports = router;
