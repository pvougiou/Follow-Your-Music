var request = require('request'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

var radius = 25; // in km

/*
 Latitude: 1 deg = 110.574 km

 Longitude: 1 deg = 111.320*cos(latitude) km
 */

function RecommendationsHandler() {
    this.dataBase = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/relatedBase.json')));
    this.basedNearQuery = "prefix mo: <http://purl.org/ontology/mo/>\n\
    select * where {\n\
    ?artist a mo:MusicArtist.\n\
    ?artist foaf:name \"%artist%\".\n\
    ?artist foaf:based_near ?loc.\n\
    ?loc a <http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing>.\n\
    ?loc rdfs:label \"%location%\"\n\
} LIMIT 100";

    this.eventQuery = "prefix mo: <http://purl.org/ontology/mo/>\n\
    select * where {\n\
        ?artist a mo:MusicArtist.\n\
        ?artist foaf:name \"%artist%\".\n\
        ?artist foaf:made ?release.\n\
        ?event mo:release ?release.\n\
        ?event dc:date ?date.\n\
        ?release dc:title ?title.\n\
        ?event <http://purl.org/NET/c4dm/event.owl#place> ?loc.\n\
        ?loc a <http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing>.\n\
        ?loc rdfs:label \"%location%\"\n\
} LIMIT 100";
}

var resultsFile = path.resolve(__dirname, '../resources/brainzResults.json');
var brainzResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

RecommendationsHandler.prototype.constructor = RecommendationsHandler;

RecommendationsHandler.prototype.getBrainzRecommendations = function (options, cb) {
    var user = options.user,
        loc = options.loc,
        self = this;

    if (!brainzResults[user]) {
        brainzResults[user] = {};
    }

    if (brainzResults[user][loc]) {
        return cb(null, brainzResults[user][loc]);
    }

    var relatedArtists = [];
    _.each(self.dataBase.favorites[user], function (artist) {
        if (self.dataBase.relatedArtists[artist]) {
            relatedArtists = relatedArtists.concat(self.dataBase.relatedArtists[artist]);
        }
    });
    relatedArtists = self.dataBase.favorites[user].concat(relatedArtists);

    var relatedLocs = [];
    if (self.dataBase.upperLocations[loc]) {
        relatedLocs = relatedLocs.concat(self.dataBase.upperLocations[loc]);
    }
    if (self.dataBase.places[loc]) {
        relatedLocs = relatedLocs.concat(self.dataBase.places[loc]);
    }
    relatedLocs.unshift(loc);

    var endResults = [];
    async.eachSeries(relatedArtists, function (artist, artistDone) {
        async.eachSeries(relatedLocs, function (location, locationDone) {
            var currBasedQuery = self.basedNearQuery.replace(/%artist%/g, artist).replace(/%location%/g, location);
            console.log('checking currBased ' + artist);
            self._doQuery(currBasedQuery, function (err, results) {
                if (err) {
                    throw err;
                }
                if (results.length > 0) {
                    _.each(results, function (result) {
                        result.artistLabel = artist;
                        result.locationLabel = location;
                    });
                    endResults = endResults.concat(results);
                }
                var currEventQuery = self.eventQuery.replace(/%artist%/g, artist).replace(/%location%/g, location);
                console.log('checking currEvent ' + artist);
                self._doQuery(currEventQuery, function (err, results) {
                    if (err) {
                        throw err;
                    }
                    if (results.length > 0) {
                        _.each(results, function (result) {
                            result.artistLabel = artist;
                            result.locationLabel = location;
                        });
                        endResults = endResults.concat(results);
                    }
                    return locationDone(null);
                });
            });
        }, function (err) {
            return artistDone(err);
        });
    }, function (err) {
        var events = self._formatResults(user, loc, endResults);
        brainzResults[user][loc] = events;
        fs.writeFileSync(resultsFile, JSON.stringify(brainzResults, null, '  '));
        return cb(err, events);
    });
};

RecommendationsHandler.prototype._formatResults = function (user, loc, input) {
    var results = [],
        self = this;
    /*
     {
     "location": "Lisbon",
     "type": "Release",
     "title": "Seven Seas of Rhye",
     "description": "<span class=\"location-title\">Seven Seas of Rhye</span> by <span class=\"location-artist\">Queen</span> was released in Lisbon in February 1974<br/><span class=\"location-comment\"><span class=\"location-artist\">Queen</span> is related to <span class=\"location-artist\">David Bowie</span>, one of your favorite artists</span>"
     },
     {
     "location": "Estadio Restelo, Lisbon, Portugal",
     "type": "Performance",
     "title": "Queen",
     "description": "<span class=\"location-artist\">Queen</span> performed here on Saturday 02 July 2005<br/><span class=\"location-comment\"><span class=\"location-artist\">Queen</span> is related to <span class=\"location-artist\">David Bowie</span>, one of your favorite artists</span>"
     }
     */
    _.each(input, function (event) {
        var output = {};
        output.artist = event.artistLabel;
        if (event.release) {
            output.type = 'Release'
        }
        else {
            output.type = 'BasedNear'
        }
        if (_.indexOf(self.dataBase.upperLocations[loc], event.locationLabel) !== -1) {
            output.location = loc;
        }
        else {
            output.location = event.locationLabel;
        }
        switch (output.type) {
            case 'Release':
                output.title = event.title.value;
                output.description = "<span class=\"location-title\">" + output.title + "</span> by <span class=\"location-artist\">" + event.artistLabel + "</span> was released in " + output.location + " [" + event.date.value + "]";
                break;
            case 'BasedNear':
                output.title = output.artist;
                output.description = "<span class=\"location-artist\">" + event.artistLabel + "</span> is based near " + output.location;
            default:
                throw new Error('cannot solve type ' + output.type);
        }
        // TODO <br/><span class=\"location-comment\"><span class=\"location-artist\">Queen</span> is related to <span class=\"location-artist\">David Bowie</span>, one of your favorite artists</span>"
        results.push(output);
    });
    return results;
};

RecommendationsHandler.prototype._doQuery = function (query, cb) {
    var url = 'http://localhost:9999/bigdata/namespace/kb/sparql?query=';
    request.post({
        url: url + encodeURIComponent(query),
        headers: {
            'Accept': 'application/json'
        }
    }, function (error, response, body) {
        console.log(body);
        cb(error, JSON.parse(body).results.bindings);
    });
};

module.exports = RecommendationsHandler;