app.service('FloorDataService', function (LoadingService, $http, $q) {
  var self = this;

  self.availableDates = []; // [2013-06-06 00:00:00", "2013-06-06 01:00:00", ...] (comes from weather data)
  self.weatherData = {};    // {"2013-01-01 01:00:00": "37.04", ...}

  self.roomTempData = {};    // {vav: {date: temp, ...}, vav: {date: temp, ...}} (all room data for said floor)
  self.roomSetpointData = {}; // {vav: {date: setpoint, ... }, vav: {date: setpoint, .. }} (all setpoints for said floor)
  self.roomCoordinates = {}; // {"10.65.06": [[601,  59], [636, 82]], ...}
  self.vavs = {};            // {"47102": ["10.S.J"], ...}

  self.getCoordinates = function getCoordinates(floorLevel) {
    return $http.post('/api/v1/coordinates', {'floorLevel': floorLevel}).then(function(response) {
      self.roomCoordinates = response.data['roomCoordinates'];
      self.vavs = response.data['vavs'];
    });
  };

  /**
  * Initializes room data
  * data format:
  * {
  *    sensorDeviceId: { date: dataPoint, date: dataPoint, ... },
  *    ...
  * }
  * @param {string} floorLevel - floor_{roomNumber}
  * @returns {*|Promise.<TResult>}
  */
  self.getAllData = function (floorLevel) {
    const floorNumber = floorLevel.match(/\d+/g)[0];
    return $http.get(`http://bpl.dev.cisdd.org/api/floor-data/${floorNumber}/vavs`).then(function(response) {
      const roomTemps = response.data.vavs.filter(function (vav) {
        return vav.sensorType === 'Room Temperature';
      });
      roomTemps.forEach(function (roomTemp) {
        self.roomTempData[roomTemp.sensorDeviceId] = roomTemp.data;
      });

      const roomSetpoints = response.data.vavs.filter(function (vav) {
        return vav.sensorType === 'Room Setpoint';
      });
      roomSetpoints.forEach(function (roomSetpoint) {
        self.roomSetpointData[roomSetpoint.sensorDeviceId] = roomSetpoint.data;
      });

      LoadingService.makingRequest = false;
    });
  };

  self.getWeatherData = function getWeatherData() {
    return $http.get('http://bpl.dev.cisdd.org/api/weather').then(function (response) {
      self.weatherData = {};
      let weatherResponse = response.data;

      for (let i = 0; i < weatherResponse.length; ++i) {
        let date = weatherResponse[i].stime,
            temp = weatherResponse[i].temp;
        self.weatherData[date] = temp;
      }
      self.availableDates = Object.keys(self.weatherData);
    });
  };

  self.getAllFloorData = function (floorLevel) {
    LoadingService.makingRequest = true;

    var promises = [
      self.getCoordinates(floorLevel),
      self.getAllData(floorLevel),
      self.getWeatherData()
    ];

    return $q.all(promises);
  }
});
