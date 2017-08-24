const request = require('request');

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
        let results = JSON.parse(body).photos;

        callback({
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
    });
}

module.exports.getPhotoInfo = function(photo_id, callback) {
    request(formApiUrl({
        method: "flickr.photos.getInfo",
        photo_id: photo_id,
        extras: "count_faves"
    }), (error, response, body) => {
        let info = JSON.parse(body).photo;
        let owner = info.owner;

        callback({
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
                locations.push(loc.locality||null);
                locations.push(loc.county||null);
                locations.push(loc.region||null);
                locations.push(loc.country||null);
                return locations;
            })(),
            owner: {
                name: owner.realname || owner.username,
                profileurl: `http://www.flickr.com/people/${owner.nsid}`,
                buddyicon:
                    (owner.iconserver != 0) ?
                        `http://farm${owner.iconfarm}.staticflickr.com/${owner.iconserver}/buddyicons/${owner.nsid}.jpg`
                        :
                        "https://www.flickr.com/images/buddyicon.gif"
            }
        });
    });
}

function formApiUrl(customParams) {
    let url = "https://api.flickr.com/services/rest/?";

    const globalParams = {
        api_key: "***REMOVED***",
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