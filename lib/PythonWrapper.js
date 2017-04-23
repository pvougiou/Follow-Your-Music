/**
 * Created by bjdmeest on 3/09/2015.
 */

var exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

var handles = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/ArtistHandle.json'), 'utf8'));

function execScript(user, loc, cb) {
    user = 'John';

    var args = [path.resolve(__dirname, '../Script.py'), loc];
    //exec('python ' + args.join(' '), function (err, stdout, stderr) {
    //    console.log(stdout);
    //});

    var py = spawn('python', args);
    py.stdout.on('data', function (data) {
        console.log('' + data);
        //outputBody += data;
    });
    py.stderr.on('data', function (data) {
        console.log('' + data);
    });
    py.on('error', function (err) {
        throw err;
    });
    py.on('close', function (code) {
        if (code !== 0) {
            console.log('ps process exited with code ' + code);
        }
        cb(null);
    });
}

function getTweetLocations(user, loc, cb) {
    var basePath = path.resolve(__dirname, "../" + loc);
    if (!fs.existsSync(basePath + '_Locations.json')) {
        execScript(user, loc, function (err) {
            formatPython();
        });
    }
    else {
        formatPython();
    }

    function formatPython() {
        var events = [];

        var locs = JSON.parse(fs.readFileSync(basePath + '_Locations.json', 'utf8'));
        /*
         "location": "Lisbon",
         "type": "Release",
         "title": "Seven Seas of Rhye",
         "description": "<span class=\"location-title\">Seven Seas of Rhye</span> by <span class=\"location-artist\">Queen</span> was released in Lisbon in February 1974<br/><span class=\"location-comment\"><span class=\"location-artist\">Queen</span> is related to <span class=\"location-artist\">David Bowie</span>, one of your favorite artists</span>"
         }
         */
        _.each(locs, function (currLoc, key) {
            key = key.trim();
            var event = {
                type: "TwitterLocation",
                artist: handles[key],
                location: currLoc,
                title: handles[key],
                description: "<span class=\"location-artist\">" + handles[key] + "</span> tweets from " + currLoc + "!"
            };
            events.push(event);
        });

        var tweets = JSON.parse(fs.readFileSync(basePath + '_Tweets.json', 'utf8'));
        _.each(tweets, function (currTweet, key) {
            key = key.trim();
            var event = {
                type: "Tweet",
                artist: handles[key],
                location: loc,
                title: handles[key],
                description: "<span class=\"location-tweet\">" + currTweet[0] + "</span>"
            };
            events.push(event);
        });
        cb(null, events);
    }
}

module.exports.getTweetLocations = getTweetLocations;