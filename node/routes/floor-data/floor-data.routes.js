'use strict';
const router = require('express').Router(),
      floorDataHandlers = require('./floor-data.handlers');

router.param('floorNo', floorDataHandlers.getVavsByFloor);

router.get('/:floorNo/vavs', function (req, res) {
  res.json({ vavs: req.vavs });
});

module.exports = router;
