import os
import urllib2
import json
import urllib
import boto3
import sys
import base64
from pygame import mixer


polly = boto3.client('polly')

def build_translate_URL(language_to_translate_to, phrase_to_translate):
    translateData = []
    base_url = "https://translation.googleapis.com/language/translate/v2?"
    api_key = "AIzaSyB02147f0O7JMazTtkxUDtXRo_knZHDpvE"
    searchDictionary = {"key" : api_key, "q" : phrase_to_translate, "target" : language_to_translate_to}
    translate_url = base_url + urllib.urlencode(searchDictionary)
    translate_url_data_source = urllib2.urlopen(translate_url)
    translate_url_json_content = translate_url_data_source.read()
    parsed_translate_url_dictionary = json.loads(translate_url_json_content)
    translate_url_results = parsed_translate_url_dictionary["data"]
    translate_url_translation_data = translate_url_results["translations"]
    # for data in translate_url_translation_data:
    for dictionaries in translate_url_translation_data:
        if "translatedText" in dictionaries:
            translateData.append(dictionaries["translatedText"])
    for element in translateData:
        return element

def make_audio_stream(string_for_voice):
    spoken_text = polly.synthesize_speech(Text = string_for_voice,  OutputFormat = 'mp3', VoiceId = 'Emma')
    with open('output.mp3', 'wb') as f:
        print(spoken_text['AudioStream'].read())
    sys.stdout.flush()

def main():
    inputLength = len(sys.argv)
    number_of_words_to_translate = inputLength - 2
    i = 0
    string_to_translate = ""
    while i < number_of_words_to_translate:
        string_to_translate += sys.argv[i+2] + " "
        i+=1
    print string_to_translate

    translatedString = build_translate_URL(sys.argv[1], string_to_translate)
    make_audio_stream(translatedString)

main()
