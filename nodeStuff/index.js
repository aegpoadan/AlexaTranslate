let Alexa = require('alexa-sdk');
let AWS = require('aws-sdk');
AWS.config.update({accessKeyId: "AKIAJYJCD7XEQEWWWOFA", secretAccessKey: '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'});
const fs = require('fs')
const dictionaries = require('./dictionaries.js');
const s3baseURL = 'https://translate-audio.s3.amazonaws.com/';
const bucket = 'translate-audio';
const request = require('request');
const gkey = 'ya29.ElrJBJyi3yI5ZfMkk5Xxsz9ncHMuzYKx1jP6YaLaobP7wkQWHyzWoPIntjRU3S3v_lgBs7Z5aTwsmeNPsrPEOXmDwFCaR7g_liPgnNw3XhF5LkjKLj_utR49uNc';
let translateURL = 'https://translation.googleapis.com/language/translate/v2';
let axios = require('axios');

axios.defaults.baseURL = 'https://translation.googleapis.com/language/translate/';
axios.defaults.headers.common['Authorization'] = 'Bearer ya29.ElrJBJyi3yI5ZfMkk5Xxsz9ncHMuzYKx1jP6YaLaobP7wkQWHyzWoPIntjRU3S3v_lgBs7Z5aTwsmeNPsrPEOXmDwFCaR7g_liPgnNw3XhF5LkjKLj_utR49uNc';
axios.defaults.headers.post['Content-Type'] = 'application/json';

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1',
});

function languageToCode(language) {
	return dictionaries.languageCodeDictionary[language];
}

function getVoiceActor(language) {
	var supportedLanguage = dictionaries.translatorVoices[language];
	if(supportedLanguage) {
		return supportedLanguage[0];
	} else {
		return dictionaries.translatorVoices["English"][1];
	}
}

function putObjectToS3(bucket, key, data){
    var s3 = new AWS.S3();
    var params = {
        Bucket : bucket,
        Key : key,
        Body : data
    }
    s3.putObject(params, function(err, data) {
      if (err) {
      	console.log(err, err.stack);
    	} else {
    		console.log("The file was successfully uploaded to S3!");
  		}          
    });
};

function translateText(language, text, callback) {
		const languageCode = languageToCode(language);
		if(!languageCode) {
			console.error("Unsupported language specified!");
			return "Unsupported language specified!";
		}
		const voiceActor = getVoiceActor(language);
		
		axios.post('/v2', {
	    q: text,
	    source: 'en',
	    target: languageCode,
	    format: 'text'
	  })
	  .then(function (response) {
	    console.log(response.data.data.translations[0].translatedText);

	    function textToSpeech(text) {
				let params = {
			    'Text': text,
			    'OutputFormat': 'mp3',
			    'VoiceId': voiceActor,
				};

				Polly.synthesizeSpeech(params, (err, data) => {
			    if (err) {
			        console.log(err.code)
			    } else if (data) {
			        if (data.AudioStream instanceof Buffer) {
			            putObjectToS3(bucket, 'speechTranslated.mp3', data.AudioStream);
			            var resultURL = s3baseURL + 'speechTranslated.mp3';
			            console.log(resultURL);
			            callback(resultURL);
			        }
			    }
				});
			};

			textToSpeech(response.data.data.translations[0].translatedText);
	  })
	  .catch(function (error) {
	    console.log(error);
	    return null;
	  });
};

let handlers = {
    'Translate': function () {
    		var language = this.event.request.intent.slots.Language.value;
    		var text = this.event.request.intent.slots.Text.value;
    		var saveThis = this;

    		translateText(language, text, function(resultURL) {
    			console.log('result URL: ' + resultURL);

    			saveThis.response.audioPlayerPlay('REPLACE_ALL', resultURL, '0', null, 0);
          saveThis.emit(':responseReady');
    		});
    }
};

exports.handler = (event, context, callback) => {
		var alexa = Alexa.handler(event, context, callback);
		alexa.registerHandlers(handlers);
		alexa.execute();
};