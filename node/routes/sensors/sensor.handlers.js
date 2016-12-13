'use strict';
const request = require('request'),
      qs = require('qs'),
      config = require('../../config/config');

/**
 * Pads single-digit numbers with zero on left; returns otherwise
 * @param {string} numberString - must be a number.
 * @returns {string} two-digit string
 */
function zeroFill(numberString) {
  if (isNaN(numberString))
    throw Error('Requires number');
  if (numberString < 10) return '0' + numberString;
  return numberString;
}

module.exports.getSensorData = function (req, res) {
  const sensorNumber = req.params.sensorId;
  const url = `https://bpl.cisdd.org/bpl/reporting/dataexport.php?idnum=${sensorNumber}&objtype=sensor&callback=`;
  request.post(
    {
      url: url,
      form: qs.stringify(`username=${config.BPL_READ_USER}&password=${config.BPL_PW}&submit=Submit`)
    },
    function (error, response, body) {
      if (error) {
        console.error(error);
        return;
      }

      body = body.replace(/[();]/g, ''); // remove parentheses and semicolons
      let sensorData = JSON.parse(body).map(function (datum) {
        const dateObject = new Date(datum[0]),
              year = dateObject.getFullYear(),
              month = zeroFill(dateObject.getMonth() + 1),
              date = zeroFill(dateObject.getDate()),
              hours = zeroFill(dateObject.getHours()),
              minutes = zeroFill(dateObject.getMinutes()),
              seconds = zeroFill(dateObject.getSeconds());
        const formattedDate = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
        return { 'date': formattedDate, 'value': datum[1] }
      });

      res.json({ data: sensorData });
    });
};
