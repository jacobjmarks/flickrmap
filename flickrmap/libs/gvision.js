const request = require("request");

/**
 * Function to fetch annotations on a given image using Google Cloud Vision API.
 * @param {string} image_url - The url of the image to annotate.
 * @param {Function} callback - Callback to handle resulting annotations.
 */
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
        let gvision = (JSON.parse(body)).responses[0];
        
        // Form the data to be given to the client, using
        // only what we need from the API response.
        callback({
            landmark: (gvision.landmarkAnnotations && 
                       gvision.landmarkAnnotations[0].description)||null,
            labels: (() => {
                let labels = [];
                let numLabels = gvision.labelAnnotations.length;
                for (let i = 0; i < numLabels; i++) {
                    labels.push(gvision.labelAnnotations[i].description);
                }
                return labels;
            })()
        });
    });
}