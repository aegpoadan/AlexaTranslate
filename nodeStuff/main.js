let Alexa = require('alexa-sdk');
let spawn = require("child_process").spawn;

let handlers = {

    'Translate': function () {
    		var language = this.event.request.intent.slots.Language.value;
    		var text = this.event.request.intent.slots.Text.value;
				let process = spawn('python',["main.py", language, text]);

				process.stdout.on('data', function (audioStream){
					var uInt8Array = new Uint8Array(audioStream);
 					var arrayBuffer = uInt8Array.buffer;
 					var blob = new Blob([arrayBuffer]);
 					var url = URL.createObjectURL(blob);

      	 	return {
      			"response": {
	            "directives": [
	                {
	                    "type": "AudioPlayer.Play",
	                    "playBehavior": "REPLACE_ALL",
	                    "audioItem": {
	                        "stream": {
	                            "token": "12345",
	                            "url": url,
	                            "offsetInMilliseconds": 0
	                        }
	                    }
	                }
	            	],
	        		"shouldEndSession": true
    				}
					}
				});
    }

};

exports.handler = (event, context, callback) => {
		var alexa = Alexa.handler(event, context, callback);
		alexa.registerHandlers(handlers);
		alexa.execute();

    callback(null, 'Success!');
};