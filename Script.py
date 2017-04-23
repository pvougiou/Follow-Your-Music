import tweepy
import requests
import argparse
import cPickle as pickle
import sys
import json


with open('resources/relatedBase.json') as data_file:    
    data = json.load(data_file)
artists = data['favorites']['John Domingue']
for item in data['relatedArtists']['Paolo Nutini']:
    artists.append(item)

for item in data['relatedArtists']['David Bowie']:
    artists.append(item)


parser = argparse.ArgumentParser(description='Follow Your Music -- Follow the locations of your favourite artists.', formatter_class=argparse.ArgumentDefaultsHelpFormatter, add_help=False);

parser.add_argument('-h', '--help', action='help', help='Show this help message and exit.')

parser.add_argument('location', nargs='?', type=str, default='London',
                    help='Specify whether a localized or not search will be performed.');

args = parser.parse_args();
position = args.location
    
#print artists
#print position


"""ckey = 'xg2icXuTyk7XjzZel1vsU9jzX'
csecret = 'VcJfl8ubJlkH9mqC6giEu6GeRIaUlrqTvlnfdQNG6pnEclJSPm'
atoken = '2582687466-jLibuQMk1E1PkrgN5QDAOKnC0nIHjD2PrqIHSQx'
asecret = 'MEszlAeagwNxkcQFSTTWoclRTvMHWQpaHJKySFfjqfgjZ'



auth = tweepy.OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)

 #artists = ['Metallica', 'Dr. Dre', 'Rihanna', 'Bon Jovi']
#raw_input("Table has been submitted successfully. Press Enter to continue...");
api = tweepy.API(auth, wait_on_rate_limit=True, wait_on_rate_limit_notify=True);

accID = {}
accLocation = {}

for i in range(0, len(artists)):
    try:
        cache = api.search_users(artists[i], 1, 1)

        for c in cache:
            if c.verified is True:
             
                accID[c.id] = c.screen_name;
                accLocation[c.screen_name] = c.location;


    except tweepy.error.TweepError:
        print ('No Success for: '), arg[i];





def TwitterTagBuilder(arg, api):
    acc = {'accName': [], 'id': [], 'location': []}
    #twitterStarTime = time.time();
    for i in range(0, len(arg)):
        try:
            cache = api.search_users(arg[i], 1, 1)
            
            for c in cache:
                if c.verified is True:
                    acc['accName'].append(c.screen_name);
                    acc['id'].append(c.id);
                    acc['location'].append(c.location)
                    
 
        except tweepy.error.TweepError:
            print ('No Success for: '), arg[i];
            #arg.pop(i);
    return acc;


def TimelineBuilder(arg, api):
    comments = {}
    #acc = {'id': [], 'id': [], 'location': []}
    for ID in arg:
        try:
            comments[accID[ID]] = [];
            temp = api.user_timeline(user_id=ID, count=20);
            for c in temp:
                comments[accID[ID]].append(c.text.encode('utf-8'));
                #print c.text.encode('utf-8')
                #print c.place
        except tweepy.error.TweepError:
            print('Problem')
    return comments


timelines = TimelineBuilder(accID, api);



#print timelines
pickle.dump(accID, open( "resources/accID.p", "wb" ) )
pickle.dump(accLocation, open( "resources/accLocation.p", "wb" ) )
pickle.dump(timelines, open( "resources/timelines.p", "wb" ) )"""

accID = pickle.load( open( "resources/accID.p", "rb" ) )
accLocation = pickle.load( open( "resources/accLocation.p", "rb" ) )
timelines = pickle.load( open( "resources/timelines.p", "rb" ) )



locations = {}
returnTweets = {}
returnLocations = {}
for key in timelines:
    locations[key] = []
    for j in range(0, len(timelines[key])):
        text = timelines[key][j].replace('#', '').replace(',', '');
        string = ''
        for w in text.split(' '):
            string = string + w + '+'
        #print string


        #locations = [];
    
        annotations = requests.get('http://localhost:2222/rest/annotate?text=' + string + '&confidence=0.35&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=DBpedia:Place&sparql=');
        #print annotations.text.encode('utf-8');
        try:
            process = json.loads(annotations.text.encode('utf-8'))
        except:
            process = {}
        if 'Resources' in process:
            process = process['Resources']
            for item in process:
                if item['@surfaceForm'].lower() == position.lower() and key not in returnTweets:
                    returnTweets[key] = [timelines[key][j]]
                elif  item['@surfaceForm'].lower() == position.lower() and key in returnTweets:
                    returnTweets[key].append([timelines[key][j]])
                if item['@surfaceForm'].lower() not in locations[key]:
                    locations[key].append(item['@surfaceForm'])



        """while process.find("target=\"_blank\">") > 0:
            flag = process.find('</a>');
            if process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() == position.lower() and key not in returnTweets:
                returnTweets[key] = [timelines[key][j]]
            elif  process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() == position.lower() and key in returnLocations:
                returnTweets[key].append(timelines[key][j])
            if process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() not in locations[key]:
                locations[key].append(process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower())
            process = process[flag + len('</a>'):]"""
    text = accLocation[key].replace(',', ''); 
    string = ''
    for w in text.split(' '):
        string = string + w + '+'






    #locations = [];
    annotations = requests.get('http://localhost:2222/rest/annotate?text=' + string + '&confidence=0.35&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=DBpedia:Place&sparql=');
    try:
        process = json.loads(annotations.text.encode('utf-8'))
    except:
        process = {}

    if 'Resources' in process:
        process = process['Resources']
        for item in process:
            if item['@surfaceForm'].lower() == position.lower() and key not in returnLocations:
                returnLocations[key] = position
            elif  item['@surfaceForm'].lower() == position.lower() and key in returnLocations:
                returnLocations[key].append(position)
            if item['@surfaceForm'].lower() not in locations[key]:
                locations[key].append(item['@surfaceForm'])
    """while process.find("target=\"_blank\">") > 0:
        flag = process.find('</a>');
        if process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() == position.lower() and key not in returnLocations:
            returnLocations[key] = position
        elif  process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() == position.lower() and key in returnLocations:
            returnLocations[key].append(position)

            
        if process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower() not in locations[key]:
            locations[key].append(process[process.find("target=\"_blank\">") + len("target=\"_blank\">"):flag].lower())
        process = process[flag + len('</a>'):]"""

#print locations
#print returnTweets

with open(position + '_Locations.json', 'w') as fp:
    json.dump(returnLocations, fp)

with open(position + '_Tweets.json', 'w') as fp:
    json.dump(returnTweets, fp)
