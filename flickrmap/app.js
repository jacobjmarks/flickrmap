const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const pug = require('pug');
const path = require('path');
const router = express.Router();
const app = express();

const port = 80;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.route('/')
    .get((req, res) => {
        console.log("GET /");
        res.render('index.pug');
    })
    .post((req, res) => {
        var body = req.body;
        console.log("POST /", body);

        beginSearch(body.tags, body.page, body.per_page, (data) => {
            res.json(data);
            res.end();
            console.log("\tCOMPLETE");
        });
    })

app.use(router);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

function beginSearch(tags, page, per_page, callback) {
    request(getFlickrApiUrl({
        method: "flickr.photos.search",
        tags: tags,
        page: page,
        per_page: per_page,
        has_geo: true
    }), (error, response, body) => {
        var photos = JSON.parse(body).photos.photo;

        if (photos.length == 0) {
            callback(null);
        }

        formPhotoData(photos, (data) => {
            callback(data);
        });
    });
}

function formPhotoData(photos, callback) {
    var data = [];
    var imagesProcessed = 0;
    for (i = 0; i < photos.length; i++) {
        ((i, imageUrl) => {
            request(getFlickrApiUrl({
                method: "flickr.photos.geo.getLocation",
                photo_id: photos[i].id
            }), (error, response, body) => {
                var location = JSON.parse(body).photo.location;
                data.push({
                    url: imageUrl,
                    lat: location.latitude,
                    lon: location.longitude
                });

                imagesProcessed++;
                if (imagesProcessed == photos.length) {
                    callback(data);
                }
            });
        })(i, getFlickrImageUrl(photos[i]));
    }
}

function getFlickrApiUrl(customParams) {
    var url = "https://api.flickr.com/services/rest/?";

    const globalFlickrApiParams = {
        api_key: "***REMOVED***",
        format: "json",
        nojsoncallback: true
    };

    var addParams = function(params) {
        for (var key in params) {
            var val = params[key];
            url += `&${key}=${val}`;
        }
        return addParams;
    }

    addParams(customParams)(globalFlickrApiParams);

    return url;
}

function getFlickrImageUrl(photo) {
    return `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg`;
}