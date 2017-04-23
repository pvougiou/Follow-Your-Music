// here are the functions for the google maps app


// the google map
var map, place, geocoder;
// initialization of the map
function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 35.028936, lng: 24.760065 },
        zoom: 14
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    // [START region_getplaces]
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();
        // get the address of the location
        place = places[0].formatted_address.split(',')[0];
        //place = document.getElementById('pac-input').value;
        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        deleteMarkers();

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
            var icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=L|FF0000|0000FF'

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: 'you are here',
                position: place.geometry.location,
                animation: google.maps.Animation.DROP
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);

        changeCoordinates(place);
    });
    // [END region_getplaces]


    //// code for creating the custom marker on click
    //google.maps.event.addListener(map, 'click', function (event) {
    //    deleteMarkers();
    //    var lat = event.latLng.lat();
    //    var lng = event.latLng.lng();
    //    pushMarker({ location: { 'lat': lat, 'lng': lng } });
    //    changeCoordinates({ 'lat': lat, 'lng': lng });
    //});
}


// stores the markers that have been submited
var markers = [];
var infoViews = [];
var locations = {};

function geocode(obj, cb) {
    if (locations[obj.address]) {
        cb(locations[obj.address], google.maps.GeocoderStatus.OK);
    }
    else {
        geocoder.geocode(obj, function(results, status) {
            locations[obj.address] = results;
            cb(results, status);
        });
    }
}
// pushes a new marker on the map
function pushMarker(json) {

    geocode({ 'address': json.location }, function (results, status) {
        if (status != google.maps.GeocoderStatus.OK) {
            console.log(status);
            return;
        }
        var coordinates = results[0].geometry.location;
        // if the coordinates are fine, create the marker and the infoWindow
        if (status == google.maps.GeocoderStatus.OK) {
            // check if the marker is already on the named location
            var getIndex;
            for (var i = 1; i < markers.length; i++) {
                if (coordinates.G == markers[i].getPosition().lat() && coordinates.K == markers[i].getPosition().lng()) {
                    getIndex = i;
                    break;
                }
            }
            // if the marker already exists, just change the infoWindow
            if (getIndex != null) {
                var content = infoViews[getIndex - 1].getContent();
            }
            // create the content of the infoWindow
            var contentString =
                '<div id="content">' +
                '<div id="siteNotice">' +
                '</div>' +
                '<h1 id="firstHeading" class="firstHeading">' + json.title + '</h1>';

            if (json.related != null) {
                contentString = contentString + '<h4 style="font-size: small;font-style: italic">' + json.artist + ' is related to ' + json.related + '</h4>';
            }

            var contentString = contentString +
                '<h5 id="secondHeading">' + json.type + '</h5>' +
                '<div id="bodyContent">' +
                '<p>' + json.description + '</p>' +
                '</div>' +
                '</div>';

            // if marker already on the map, just change the content 
            if (getIndex != null) {
                var newContent = content + contentString;
                infoViews[getIndex - 1].setContent(newContent);
                markers[getIndex].title = 'Miscellaneous';
                var icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=M|00FF00|0000FF';
                markers[getIndex].setIcon(icon);
                markers[getIndex].addListener('click', function () {
                    infoViews[getIndex - 1].open(map, markers[getIndex]);
                });
                return;
            }
            // otherwise
            else {
                // create the infoWindow containing the content string
                var infoWindow = new google.maps.InfoWindow({
                    content: contentString
                });
                infoViews.push(infoWindow);

                // set the propper icon
                var icon;
                if (json.type == 'TwitterLocation') {
                    icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=T|4099FF|0000FF'
                } else if (json.type == 'Tweet') {
                    icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=T|4099FF|0000FF'
                } else if (json.type == 'Performance') {
                    icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=P|FF4500|0000FF'
                } else if (json.type == 'Release') {
                    icon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=R|9400D3|0000FF'
                }

                var marker = new google.maps.Marker({
                    animation: google.maps.Animation.DROP,
                    icon: icon,
                    position: coordinates,
                    map: map,
                    title: json.title
                });
                markers.push(marker);

                marker.addListener('click', function () {
                    infoWindow.open(map, marker);
                });
            }
        }
    });
}

// getting the data from the server
var socket = io();
socket.on('sendDataToCient', function (data) {
    var events = data.events;
    for (var i = 0; i < events.length; i++) {
        doTimeout(events[i], i);
    }
})

function doTimeout(event, i) {
    setTimeout(function () {

        pushMarker(event);

    }, 200 * i);
}


///////////////////////////////////////////////////////////////
// Additional Marker Functions
// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}
// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}
// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}
// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
    infoViews = [];
}



