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
        let params = req.body;
        console.log("POST /", params);

        flickrSearch(params, (photoData) => {
            console.log(` -> SERVING ${(photoData) ? photoData.photos.length : 0} PHOTOS`);
            res.json(photoData);
            res.end();
        });
    })

router.post("/user/:user_id", (req, res) => {
    console.log(`POST /user/${req.params.user_id}`);
    getFlickrUserInfo(req.params.user_id, (userinfo) => {
        console.log(` -> SERVING USER INFO`);
        res.json(userinfo);
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
            photos: []
        };
        for (i = 0; i < photos.length; i++) {
            let p = photos[i];
            photoData.photos.push({
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

function getFlickrUserInfo(user_id, callback) {
    request(getFlickrApiUrl({
        method: "flickr.people.getInfo",
        user_id: user_id
    }), (error, response, body) => {
        let user = JSON.parse(body).person;
        let userInfo = {
            name:
                (user.realname && user.realname._content) ?
                    user.realname._content
                    :
                    user.username._content,
            location: (user.location) ? user.location._content : null,
            profileurl: user.profileurl._content,
            buddyicon:
                (user.iconserver > 0) ?
                    `http://farm${user.iconfarm}.staticflickr.com/${user.iconserver}/buddyicons/${user.nsid}_r.jpg`
                    :
                    "https://www.flickr.com/images/buddyicon.gif"
        }
        callback(userInfo);
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