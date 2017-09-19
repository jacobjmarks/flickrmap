const request = require('request');

/**
 * Function to search for images using Flickr API.
 * @param {JSON Object} params - Search parameters.
 * @param {Function} callback - Callback to handle search results.
 */
module.exports.search = function(params, callback) {
    request(formApiUrl({
        method: "flickr.photos.search",
        text: params.text,
        sort: params.sort,
        page: params.page,
        per_page: params.per_page,
        has_geo: true,
        extras: "geo"
    }), (error, response, body) => {
        if (error || response.statusCode != 200) {
            return callback(new Error("API response error."));
        }

        try {
            let results = JSON.parse(body).photos;

            // Form the data to be given to the client, using
            // only what we need from the API response.
            callback(null, {
                page: results.page,
                pages: results.pages,
                total: results.total,
                photos: (() => {
                    let photos = [];
                    let numPhotos = results.photo.length;
                    for (i = 0; i < numPhotos; i++) {
                        let photo = results.photo[i];
                        photos.push({
                            photo_id: photo.id,
                            url: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`,
                            url_q: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg`,
                            lat: photo.latitude,
                            lon: photo.longitude
                        });
                    }
                    return photos;
                })()
            });
        } catch (err) {
            return callback(new Error("API format error."));
        }
    });
}

/**
 * Function to retrieve extended photo information using Flickr API.
 * @param {string} photo_id - The ID of the photo to fetch information.
 * @param {Function} callback - Callback to handle photo info.
 */
module.exports.getPhotoInfo = function(photo_id, callback) {
    request(formApiUrl({
        method: "flickr.photos.getInfo",
        photo_id: photo_id,
        extras: "count_faves"
    }), (error, response, body) => {
        if (error || response.statusCode != 200) {
            return callback(new Error("API response error."));
        }

        try {
            let info = JSON.parse(body).photo;
            let owner = info.owner;

            // Form the data to be given to the client, using
            // only what we need from the API response.
            callback(null, {
                photohref: `https://www.flickr.com/photos/${owner.nsid}/${photo_id}`,
                title: info.title._content,
                description: info.description._content,
                views: info.views,
                comments: info.comments._content,
                faves: info.count_faves,
                tags: (()=> {
                    let tags = [];
                    let tagArray = info.tags.tag;
                    let numTags = tagArray.length;
                    for(i = 0; i < numTags; i++) {
                        tags.push(tagArray[i].raw);
                    }
                    return tags;
                })(),
                location: (() => {
                    let locations = [];
                    let loc = info.location;
                    if (loc.locality) { locations.push(loc.locality); }
                    if (loc.county)   { locations.push(loc.county);   }
                    if (loc.region)   { locations.push(loc.region);   }
                    if (loc.country)  { locations.push(loc.country);  }
                    return locations;
                })(),
                owner: {
                    name: owner.realname || owner.username,
                    profilehref: `http://www.flickr.com/people/${owner.nsid}`,
                    buddyicon:
                        (owner.iconserver != 0) ?
                            `http://farm${owner.iconfarm}.staticflickr.com/${owner.iconserver}/buddyicons/${owner.nsid}.jpg`
                            :
                            "https://www.flickr.com/images/buddyicon.gif"
                }
            });
        } catch (err) {
            return callback(new Error("API format error."));
        }
    });
}

/**
 * Function form a custom Flickr REST API url.
 * @param {JSON Object} customParams - Custom parameters to add to the url
 */
function formApiUrl(customParams) {
    let url = "https://api.flickr.com/services/rest/?";

    const globalParams = {
        api_key: process.env.FLICKR_API_KEY,
        format: "json",
        nojsoncallback: true
    };

    let params = Object.assign({}, customParams, globalParams);

    for (let key in params) {
        let val = params[key];
        url += `&${key}=${val}`;
    }

    return url;
}