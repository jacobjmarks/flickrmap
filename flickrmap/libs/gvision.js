const request = require("request");

module.exports.annotate = function(image_url, callback) {
    request({
        method: "POST",
        url: "https://vision.googleapis.com/v1/images:annotate",
        qs: {
            key: "***REMOVED***"
        },
        body: JSON.stringify({
            requests: [
                {
                    image: {
                        source: {
                            imageUri: image_url
                        }
                    },
                    features: [
                        {
                            type: "LABEL_DETECTION",
                            maxResults: "10"
                        },
                        {
                            type: "LANDMARK_DETECTION",
                            maxResults: "1"
                        }
                    ]
                }
            ]
        })
    }, (error, response, body) => {
        callback((JSON.parse(body)).responses[0]);
    });
}