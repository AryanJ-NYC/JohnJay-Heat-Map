'use strict';
const router = require('express').Router(),
      squel = require('squel'),
      database = require('../../config/databases/mySqlConnection.js'),
      connection = database.connectionPool;

router.get('/', function (req, res) {
  let weatherQuery = squel.select()
                          .from('weather')
                          .field('id')
                          .field('stime')
                          .field('temp')
                          .toString();

  connection.query(weatherQuery, function (err, rows) {
    if (err) throw err;

    rows.map(function (tempObj) {
      tempObj.stime = formatTime(tempObj.stime);
      return tempObj;
    });

    res.json(rows);
  });
});

function formatTime (date) {
  let dateObj = new Date(date);
  let year = dateObj.getFullYear();
  let month = (dateObj.getMonth() + 1 < 10) ? `0${dateObj.getMonth()+1}` : dateObj.getMonth()+1;
  let day = (dateObj.getDate() < 10) ? `0${dateObj.getDate()}` : dateObj.getDate();
  let hour = (dateObj.getHours() < 10) ? `0${dateObj.getHours()}` : dateObj.getHours();

  return `${year}-${month}-${day} ${hour}:00:00`;
}

module.exports = router;
