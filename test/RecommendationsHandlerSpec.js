/**
 * Created by bjdmeest on 3/09/2015.
 */
var RecHandler = require('../lib/RecommendationsHandler');
var handler = new RecHandler();
var async = require('async');
var request = require('request');

var basedNearQuery = "prefix mo: <http://purl.org/ontology/mo/>\n\
    select * where {\n\
    ?artist a mo:MusicArtist.\n\
    ?artist foaf:name \"%artist%\".\n\
    ?artist foaf:based_near ?loc.\n\
    ?loc a <http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing>.\n\
    ?loc rdfs:label \"%location%\"\n\
} LIMIT 100";

var eventQuery = "prefix mo: <http://purl.org/ontology/mo/>\n\
    select * where {\n\
        ?artist a mo:MusicArtist.\n\
        ?artist foaf:name \"%artist%\".\n\
        ?artist foaf:made ?release.\n\
        ?event mo:release ?release.\n\
        ?event <http://purl.org/NET/c4dm/event.owl#place> ?loc.\n\
        ?loc a <http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing>.\n\
        ?loc rdfs:label \"%location%\"\n\
} LIMIT 100";

var artists = ['Paolo Nutini', 'Mazy', 'David Bowie', 'Frank Ocean', 'George Ezra'];
var paolorelated = ['Newton Faulkner', 'John Mayer', 'David Gray', 'James Morrison', 'James Blunt', 'Jamie Cullum', 'Nizlopi', 'KT Tunstall', 'Jason Mraz', 'Daniel Merriweather', 'Ben Harper', 'Adele', 'Damien Rice', 'Amos Lee', 'Howie Day', 'Keane', 'Jack Johnson', 'Ray LaMontagne', 'Aqualung', 'Joshua Radin'];
var davidrelated = ['Roxy Music', 'Lou Reed', 'Bryan Ferry', 'Queen', 'T. Rex', 'Sparks', 'Iggy Pop', 'Tin Machine', 'Talking Heads', 'Billy Idol', 'Marc Bolan', 'Elvis Costello', 'Freddy Mercury', 'Peter Gabriel', 'The Police', 'The Kinks', 'The Stranglers', 'Mott The Hoople', 'The Cure', 'Blondie'];
var lisbonrelatedLocs = ['Lisbon', 'Lisboa', 'Portugal', 'Auditório Viana da Mota', 'Aula Magna da Universidade de Lisboa', 'Bela Vista Park', 'Centro Cultural de Belém', 'Cervantes Studio', 'Coliseu dos Recreios', 'Estádio do Restelo', 'Êxito Estúdios', 'Fundação Calouste Gulbenkian: Grande Auditório', 'MEO Arena', 'Salão Nobre', 'TIA Studio']

//doIt({
//    artists: artists.concat(paolorelated).concat(davidrelated),
//    locations: lisbonrelatedLocs
//}, function (err, results) {
//    console.log('total: ' + results.length);
//    var omg = 12;
//});
//var results = handler._formatResults('John Domingue', 'Lisbon', JSON.parse('[{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/8c4e2d1e-c686-4f34-94bc-b618cf4e01a4#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYear","type":"literal","value":"1995"},"release":{"type":"uri","value":"http://musicbrainz.org/release/8c4e2d1e-c686-4f34-94bc-b618cf4e01a4#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/5441c29d-3602-4898-b1a1-b77fa23b8e50#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Ziggy Stardust and the Spiders From Mars ???Live???"},"artistLabel":"David Bowie","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/2ec06fa9-a73f-4d88-ade3-83b776b2e886#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYear","type":"literal","value":"1977"},"release":{"type":"uri","value":"http://musicbrainz.org/release/2ec06fa9-a73f-4d88-ade3-83b776b2e886#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/331ce348-1b08-40b9-8ed7-0763b92bd003#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Country Life"},"artistLabel":"Roxy Music","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/ea34e389-b2f4-3199-8566-99b666f7241b#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYearMonth","type":"literal","value":"1974-02"},"release":{"type":"uri","value":"http://musicbrainz.org/release/ea34e389-b2f4-3199-8566-99b666f7241b#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Seven Seas of Rhye"},"artistLabel":"Queen","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/86df0a31-8e5e-30ab-a0a6-23bae68ee556#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYear","type":"literal","value":"1974"},"release":{"type":"uri","value":"http://musicbrainz.org/release/86df0a31-8e5e-30ab-a0a6-23bae68ee556#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Killer Queen"},"artistLabel":"Queen","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/4ecf1d5b-9c79-42fa-afc8-38d9f40db725#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYearMonth","type":"literal","value":"1973-07"},"release":{"type":"uri","value":"http://musicbrainz.org/release/4ecf1d5b-9c79-42fa-afc8-38d9f40db725#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Keep Yourself Alive"},"artistLabel":"Queen","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/b808fff0-c7c1-345b-ad55-17258871adcd#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYear","type":"literal","value":"1977"},"release":{"type":"uri","value":"http://musicbrainz.org/release/b808fff0-c7c1-345b-ad55-17258871adcd#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/a94a7155-c79d-4409-9fcf-220cb0e4dc3a#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"Talking Heads: 77"},"artistLabel":"Talking Heads","locationLabel":"Portugal"},{"loc":{"type":"uri","value":"http://musicbrainz.org/area/781b0c54-3d54-362d-a941-8a617def4992#_"},"event":{"type":"uri","value":"http://musicbrainz.org/release/6a140e58-bb13-4481-8aad-0023e80be140#781b0c54-3d54-362d-a941-8a617def4992"},"date":{"datatype":"http://www.w3.org/2001/XMLSchema#gYear","type":"literal","value":"1980"},"release":{"type":"uri","value":"http://musicbrainz.org/release/6a140e58-bb13-4481-8aad-0023e80be140#_"},"artist":{"type":"uri","value":"http://musicbrainz.org/artist/9e0e2b01-41db-4008-bd8b-988977d6019a#_"},"title":{"datatype":"http://www.w3.org/2001/XMLSchema#string","type":"literal","value":"De Do Do Do, De Da Da Da"},"artistLabel":"The Police","locationLabel":"Portugal"}]'));
//console.log(JSON.stringify(results, null, '  '));

handler.getBrainzRecommendations({user: "John Domingue", loc: "Brussels"}, function (err, results) {
    console.log(JSON.stringify(results, null, '  '));
});

function doIt(options, cb) {
    var endResults = [];
    async.eachSeries(options.artists, function (artist, artistDone) {
        async.eachSeries(options.locations, function (location, locationDone) {
            var currBasedQuery = basedNearQuery.replace(/%artist%/g, artist).replace(/%location%/g, location);
            doQuery(currBasedQuery, function (err, results) {
                if (err) {
                    throw err;
                }
                console.log(results.length);
                if (results.length > 0) {
                    endResults = endResults.concat(results);
                }
                var currEventQuery = eventQuery.replace(/%artist%/g, artist).replace(/%location%/g, location);
                doQuery(currEventQuery, function (err, results) {
                    if (err) {
                        throw err;
                    }
                    console.log(results.length);
                    if (results.length > 0) {
                        endResults = endResults.concat(results);
                    }
                    return locationDone(null);
                });
            });
        }, function (err) {
            return artistDone(err);
        });
    }, function (err) {
        return cb(err, endResults);
    });
}


/*
 {
 "head" : {
 "vars" : [ "loc" ]
 },
 "results" : {
 "bindings" : [ ]
 }
 }
 */
function doQuery(query, cb) {
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


