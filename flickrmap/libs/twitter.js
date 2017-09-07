const request = require('request');

module.exports.search = function(params, callback) {
    request({
        url: formTwitterSearchUrl({
            q: params.q
        }),
        headers: {
            "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAACDo2AAAAAAAz6ao0%2FMUkZu8gW%2FgmrCE%2BulTm3g%3Dzj5FugfIcc4achD0eQNR1D0bENs8dzssMAlMALRil0cf3WvRMN"
        }
    },(error, response, body) => {
        callback(response);
    });
}

function formTwitterSearchUrl(params) {
    let url = "https://api.twitter.com/1.1/search/tweets.json";

    for (let key in params) {
        let val = params[key];
        url += `?${key}=${val}`;
    }

    return url;
}