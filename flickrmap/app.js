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

router.route('/')
    .get((req, res) => {
        console.log("GET /");
        res.render('index.pug');
    })
    .post((req, res) => {
        var params = req.body;
        console.log("POST /", params);

        flickrSearch(params, (photoData) => {
            console.log(` -> SERVING ${photoData.photos.length} PHOTOS`);
            res.json(photoData);
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
        tags: params.tags,
        sort: params.sort,
        page: params.page,
        per_page: params.per_page,
        has_geo: true,
        extras: "geo"
    }), (error, response, body) => {
        var apiResponse = JSON.parse(body).photos;
        var photos = apiResponse.photo;

        if (photos.length == 0) {
            callback(null);
            return;
        }

        var photoData = {
            page: apiResponse.page,
            photos: []
        };
        for (i = 0; i < photos.length; i++) {
            var p = photos[i];
            photoData.photos.push({
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