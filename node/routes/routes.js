'use strict';
const router = require('express').Router(),
      floorDataRoutes = require('./floor-data/floor-data.routes'),
      sensorRoutes = require('./sensors/sensor.routes'),
      weatherRoutes = require('./weather/weather.routes');

router.use('/floor-data', floorDataRoutes);
router.use('/sensors', sensorRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;
