const request = require('request');

module.exports.search = function(params, callback) {
    request({
        url: formTwitterSearchUrl(params.q, params.geocode),
        headers: {
            "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAACDo2AAAAAAAz6ao0%2FMUkZu8gW%2FgmrCE%2BulTm3g%3Dzj5FugfIcc4achD0eQNR1D0bENs8dzssMAlMALRil0cf3WvRMN"
        }
    }, (error, response, body) => {
        callback(JSON.parse(body));
    });
}

function formTwitterSearchUrl(q, geocode) {
    return `https://api.twitter.com/1.1/search/tweets.json?q=${q}&geocode=${geocode}`;
}