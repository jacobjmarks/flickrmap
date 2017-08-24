const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const pug = require('pug');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const app = express();

const port = 80;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res) => {
    console.log("GET /");
    res.render("index.pug");
});

router.post("/imagesearch", (req, res) => {
        let params = req.body;
        console.log("POST /", params);

        flickrSearch(params, (photoData) => {
            console.log(` -> SERVING ${(photoData) ? photoData.photos.length : 0} PHOTOS`);
            res.json(photoData);
            res.end();
        });
    })

router.post("/photo/:photo_id", (req, res) => {
    console.log(`POST /photo/${req.params.photo_id}`);
    getFlickrPhotoInfo(req.params.photo_id, (photoInfo) => {
        console.log(` -> SERVING PHOTO INFO`);
        res.json(photoInfo);
        res.end();
    });
})

app.use(router);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

console.log("Writing PUG templates...");
fs.writeFile(
    "public/javascripts/pugtemplates.js",
    pug.compileFileClient("views/templates/popup.pug", {name: "pugrenderPopup"})
);
console.log(" -> DONE");

function flickrSearch(params, callback) {
    request(getFlickrApiUrl({
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

function getFlickrPhotoInfo(photo_id, callback) {
    request(getFlickrApiUrl({
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

function getFlickrApiUrl(customParams) {
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