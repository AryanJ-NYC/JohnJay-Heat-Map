// create and link 'MainController' controller to angular application
app.controller('MainController', mainController);

// inject dependencies into 'MainController' controller
mainController.$inject = ['$scope', '$http', 'leafletData', 'leafletBoundsHelpers'];

// controller function
function mainController($scope, $http, leafletData, leafletBoundsHelpers) {
    // save context
    var self = this;

    // add map properties to scope
    initMap($scope);

    // add shapes to map
    addShapes(leafletData, $http, $scope);
}

// initialize and display map on webpage
var initMap = function(self) {
    // leaflet map settings
    angular.extend(self, {
        // default map properties
        defaults: {
            minZoom: 1,
            maxZoom: 3.6,
            crs: 'Simple'
        },

        // center map properties
        center: {
            lat: -190,
            lng: 150,
            zoom: 1
        },

        // set bounds
        // maxBounds: bounds,

        // layers
        layers: {
            baselayers: {
                tenthFloor: {
                    name: 'Tenth Floor',
                    type: 'imageOverlay',
                    url: 'app/assets/images/10thFloor.jpg',
                    // will fix this later
                    bounds: [[0, 347.8552729775042], [-374.5753081706553, 0]]
                }
            }
        }
    });
};

var addShapes = function(leafletData, $http, $scope) {
    // function to make http call to get content of JSON
    var getRoomDataFromJson = new Promise(function(resolve, reject) {
        $http.get('/json/floor_10/room_num.json').then(function(response) {
            var roomNumbers = response;

            $http.get('/json/floor_10/vav.json').then(function(response) {
                resolve({'roomNumbers': roomNumbers, 'vavBoxes': response});
            })
        });
    });

    // go through object and add vector shapes to map
    var addShapesToMap = function(map, roomNumbers, vavBoxes) {
        for(var vav in vavBoxes) {
            for(var i = 0; i < vavBoxes[vav].length; i++) {
                var coordinates = roomNumbers[vavBoxes[vav][i]];

                var rand_color = "#" + ((1 << 24) * Math.random() | 0).toString(16)
                var object = {color: rand_color, fillOpacity: .5};
                
                if(coordinates.length === 2) {
                    map.addLayer(new L.rectangle(coordinates, object));
                } else {
                    map.addLayer(new L.polygon(coordinates, object));
                }
            }
        }
    };

    // execute
    leafletData.getMap('map').then(function(map) {
        var data = getRoomDataFromJson.then(function(response) {
            var roomNumbers = response.roomNumbers.data;
            var vavBoxes = response.vavBoxes.data;
            addShapesToMap(map, roomNumbers, vavBoxes);
        });
    });
};
