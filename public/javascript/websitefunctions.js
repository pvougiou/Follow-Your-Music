// the website functions

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

// stored artists
var artists = [];
// submit the values
function addArtist() {
    var artist;
   
    var artist = document.getElementById('textArtist').value;

    if (isInArray(artist, artists)) {
        return;
    }
    artists.push(artist);

    // giving a new artist to the table
    var table = document.getElementById('tableArtist');
    var rowCount = table.rows.length;
    var newRow = table.insertRow(rowCount);
    newRow.id = artist;                         // the id of the row

    var firstCell = newRow.insertCell(0);       // the first 
    firstCell.innerHTML = artist;               
    firstCell.setAttribute('class', 'col-lg-3');

    var button = document.createElement('button');
    button.setAttribute('class', 'btn btn-default');
    button.setAttribute('onClick', 'return deleteArtist("' + newRow.id + '")');
    button.innerHTML = 'Remove';

    var secondCell = newRow.insertCell(1);
    secondCell.setAttribute('class', 'col-lg-1');
    secondCell.appendChild(button);

    table.appendChild(newRow);

    document.getElementById('textArtist').value = '';
}

function deleteArtist(artistID) {
    var index = artists.indexOf(artistID);
    artists.splice(index, 1);

    var table = document.getElementById('tableArtist');
    table.deleteRow(index);
}

// used in combination with the google maps functions
function changeCoordinates(coordinates) {
    var coord = document.getElementById('location');
    if (typeof(coordinates)== 'object') {
        coord.innerHTML = 'latitude: ' + coordinates.lat + ' longitude: ' + coordinates.lng;
    } else if (typeof (coordinates) == 'string') {
        coord.innerHTML = coordinates;
    }
}

/////////////////////////////////////////////////////
// The search button

var socket = io.connect('http://localhost:3000', { reconnect: true });
var lastArtists = [], lastPlace = '';

function checkArtist() {
    if (lastArtists.length == artists.length) {
        for (var i = 0; i < artists.length; i++) {
            if (lastArtists[i] != artists[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function Search() {
    if (checkArtist() && lastPlace == place) {
        return;
    }
    lastArtists = artists;
    lastPlace = place;
    socket.emit('ArtistAndLocation', {
        'location': place,
        'artists': artists
    });
}