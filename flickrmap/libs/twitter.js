const request = require('request');

module.exports.search = function(params, callback) {
    request({
        url: formTwitterSearchUrl({
            geocode: params.geocode
        }),
        headers: {
            "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAACDo2AAAAAAAz6ao0%2FMUkZu8gW%2FgmrCE%2BulTm3g%3Dzj5FugfIcc4achD0eQNR1D0bENs8dzssMAlMALRil0cf3WvRMN"
        }
    }, (error, response, body) => {
        callback(JSON.parse(body));
    });
}

function formTwitterSearchUrl(customParams) {
    let url = "https://api.twitter.com/1.1/search/tweets.json?";
    
        const globalParams = {
            q: "-RT filter:images",
            tweet_mode: "extended"
        };
    
        let params = Object.assign({}, customParams, globalParams);
    
        for (let key in params) {
            let val = params[key];
            url += `&${key}=${val}`;
        }
        
        return url;
}