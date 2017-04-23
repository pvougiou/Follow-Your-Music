var express = require('express'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    RecommendationsHandler = require('./lib/RecommendationsHandler.js'),
    PythonWrapper = require('./lib/PythonWrapper.js');
var app = express(),
    handler = new RecommendationsHandler();

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile('index.html');
});

// the io socket
var http = require('http').Server(app);

var io = require('socket.io')(http);
// getting the data form the client
var clientData; // = { location: 'Lisbon', artists: ['David Bowie', 'U2', 'Metallica'] }

io.sockets.on('connection', function (socket) {
    socket.on('ArtistAndLocation', function (data) {
        // getting the data form the client side
        clientData = data;
        /**
         * Here the other functions are evaluated
         */

        var user = "John Domingue",
            loc = clientData.location;
        handler.getBrainzRecommendations({user: user, loc: loc}, function (err, events) {
            PythonWrapper.getTweetLocations(user, loc, function (err, tweetEvents) {
                var allEvents = events.concat(tweetEvents);
                rankandrelated(allEvents);
                io.emit('sendDataToCient', {events: allEvents});
            });
        });
    });
});

function rankandrelated(events) {
    var db = JSON.parse(fs.readFileSync(path.resolve(__dirname, './resources/relatedBase.json'), 'utf8'));

    events.sort(function(a, b) {
        if (a.title.toLowerCase().indexOf('concert')) {
            return +1;
        }
        if (b.title.toLowerCase().indexOf('concert')) {
            return -1;
        }
        if (a.type === 'Tweet') {
            return +1;
        }
        if (b.type === 'Tweet') {
            return -1;
        }
        return 0;
    });

    _.each(events, function(event) {
        var currRelated = [];
        _.each(db.relatedArtists, function(related, artist) {
            if (_.indexOf(related, event.artist) !== -1) {
                currRelated.push(artist);
            }
        });
        if(currRelated.length > 1) {
            currRelated[currRelated.length - 1] = 'and ' + currRelated[currRelated.length - 1];
            event.related = currRelated.join(', ');
        }
        else if (currRelated.length === 1){
            event.related = currRelated[0];
        }
    });
}

var server = http.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Follow your music listening at http://%s:%s', host, port);
});