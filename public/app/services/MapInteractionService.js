app.service('MapInteractionService', function (TableToMapService, FloorDataService, leafletData, $rootScope) {
  var self = this;

  // container for layers
  self.vectorLayers = {};

  // add specific VAV box to map
  self.addMarkersToMap = function (date) {
    $rootScope.displayDate = date;

    leafletData.getMap('map').then(function (map) {

      // go through all vavs on floor
      for (var vav in FloorDataService.vavs) {

        // if the currentDate is in that vav set
        if (date in FloorDataService.roomTempData[vav]) {

          // get the temp of that vav
          var temp = self.getTemp(vav, date);
          var color = TableToMapService.getColorFromRanges(temp).color;

          // get the room setpoint of that vav
          var roomSetpoint = self.getRoomSetpoint(vav, date);

          // get the damper angle of that vav
          var damperAngle = self.getDamperAngle(vav, date);

          // go through rooms in vav box and add markers to map
          for (var i = 0; i < FloorDataService.vavs[vav].length; i++) {

            var coordinates = FloorDataService.roomCoordinates[FloorDataService.vavs[vav][i]];
            var layer = self.getMarkerType(coordinates, color, temp, roomSetpoint, damperAngle, map.getZoom());

            if (damperAngle) {
              var stripes = new L.stripePattern({ angle: damperAngle, weight: 2, color: color });
              stripes.addTo(map);
              layer.options.fillPattern = stripes;
            }

            if (!self.vectorLayers.hasOwnProperty(vav)) {
              self.vectorLayers[vav] = [];
            }

            map.addLayer(layer);
            self.vectorLayers[vav].push(layer);
          }
        }
      }
    });
  };

  // remove specific VAV Box from map
  self.removeMarkersFromMap = function () {

    leafletData.getMap('map').then(function (map) {
      for (var vav in FloorDataService.vavs) {
        for (var i = 0; i < self.vectorLayers[vav].length; i++) {
          map.removeLayer(self.vectorLayers[vav][i]);
        }

        delete self.vectorLayers[vav];
      }
    });
  };

  self.getMarkerType = function (coordinates, color, currentTemp, currentSetpoint, damperAngle, zoom) {
    var degreeSign = String.fromCharCode(parseInt("00B0", 16));
    var popup = 'Current Temp: ' + currentTemp + degreeSign;
    if (currentSetpoint) {
      popup += '<br/>Setpoint: ' + currentSetpoint + degreeSign;
    }
    if (damperAngle) {
      popup += '<br/>Damper Angle: ' + damperAngle + degreeSign;
    }

    var object = {
      color: color,
      fillOpacity: .5,
    };

    if ($rootScope.marker_type === 'Circles') {
      var latlng = L.latLng((coordinates[0][0] + coordinates[1][0]) / 2, (coordinates[0][1] + coordinates[1][1]) / 2);

      // setpoint ranges from 63 to 78
      var radius = currentSetpoint - 60;

      // radius must change to correspond with zoom
      if (zoom == 1) {
        radius = (radius) * 2;
      } else if (zoom == 2) {
        radius = (radius) * 4;
      }

      return new L.circleMarker(latlng, object).setRadius(radius).bindPopup(popup);

    } else if ($rootScope.marker_type === 'Squares') {
      return new L.rectangle(coordinates, object).bindPopup(popup);
    }
  };

  self.getTemp = function (vav, date) {
    var roomTemp = FloorDataService.roomTempData[vav][date];
    if ($rootScope.marker_options == 'Temp') {
      return roomTemp;
    } else if ($rootScope.marker_options == 'Temp: Inside Vs Outside') {
      return Math.abs(FloorDataService.weatherData[date] - roomTemp) * 2;
    }
  };

  self.getRoomSetpoint = function (vav, date) {
    var roomSetpoint = FloorDataService.roomSetpointData[vav][date];
    return roomSetpoint;
  };

  self.getDamperAngle = function (vav, date) {
    var damperAngle = FloorDataService.damperAngles[vav][date];
    return damperAngle;
  };
});
