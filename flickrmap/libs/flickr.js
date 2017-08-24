const request = require('request');

var exports = module.exports;

exports.search = function(params, callback) {
    request(formApiUrl({
        method: "flickr.photos.search",
        text: params.text,
        sort: params.sort,
        page: params.page,
        per_page: params.per_page,
        has_geo: true,
        extras: "geo"
    }), (error, response, body) => {
        let apiResponse = JSON.parse(body).photos;
        let photos = apiResponse.photo;

        if (photos.length == 0) {
            callback(null);
            return;
        }

        let photoData = {
            page: apiResponse.page,
            pages: apiResponse.pages,
            total: apiResponse.total,
            photos: []
        };
        for (i = 0; i < photos.length; i++) {
            let p = photos[i];
            photoData.photos.push({
                photo_id: p.id,
                user_id: p.owner,
                title: p.title,
                url: `https://farm${p.farm}.staticflickr.com/${p.server}/${p.id}_${p.secret}.jpg`,
                url_q: `https://farm${p.farm}.staticflickr.com/${p.server}/${p.id}_${p.secret}_q.jpg`,
                lat: p.latitude,
                lon: p.longitude
            });
        }
        callback(photoData);
    });
}

exports.getPhotoInfo = function(photo_id, callback) {
    request(formApiUrl({
        method: "flickr.photos.getInfo",
        photo_id: photo_id,
        extras: "count_faves"
    }), (error, response, body) => {
        let info = JSON.parse(body).photo;
        let owner = info.owner;
        let clientData = {
            title: info.title._content,
            description: info.description._content,
            views: info.views,
            comments: info.comments._content,
            faves: info.count_faves,
            tags: (()=> {
                let tagArray = info.tags.tag;
                let tags = [];
                for(i = 0; i < tagArray.length; i++) {
                    tags.push(tagArray[i].raw);
                }
                return tags;
            })(),
            location: (() => {
                let loc = info.location;
                let locations = [];
                locations.push(loc.locality||null);
                locations.push(loc.county||null);
                locations.push(loc.region||null);
                locations.push(loc.country||null);
                return locations;
            })(),
            owner: {
                name: (owner.realname) ? owner.realname : owner.username,
                profileurl: `http://www.flickr.com/people/${owner.nsid}`,
                buddyicon:
                    (owner.iconserver != 0) ?
                        `http://farm${owner.iconfarm}.staticflickr.com/${owner.iconserver}/buddyicons/${owner.nsid}.jpg`
                        :
                        "https://www.flickr.com/images/buddyicon.gif"
            }
        }
        callback(clientData);
    });
}

function formApiUrl(customParams) {
    let url = "https://api.flickr.com/services/rest/?";

    const globalFlickrApiParams = {
        api_key: "***REMOVED***",
        format: "json",
        nojsoncallback: true
    };

    const addParams = function(params) {
        for (let key in params) {
            let val = params[key];
            url += `&${key}=${val}`;
        }
        return addParams;
    }

    addParams(customParams)(globalFlickrApiParams);

    return url;
}