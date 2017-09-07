const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug');
const path = require('path');
const fs = require('fs');

const flickr = require('./libs/flickr.js');
const twitter = require('./libs/twitter.js');

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
    flickr.search(params, (results) => {
        console.log(` -> SERVING ${results.photos.length} PHOTOS`);
        res.json(results);
        res.end();
    });
});

router.post("/photo/:photo_id", (req, res) => {
    console.log(`POST /photo/${req.params.photo_id}`);
    flickr.getPhotoInfo(req.params.photo_id, (photoInfo) => {
        console.log(` -> SERVING PHOTO INFO`);
        res.json(photoInfo);
        res.end();
    });
})

router.post("/tweets", (req, res) => {
    let params = req.body;
    console.log("POST /tweets", params);
    twitter.search(params, (tweets) => {
        res.json(JSON.parse(tweets.body));
        res.end();
    })
});

app.use(router);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Generate and write client-side js PUG templates...
console.log("Writing PUG templates...");
fs.writeFile(
    "public/javascripts/pugtemplates.js",
    pug.compileFileClient("views/templates/popup.pug", {name: "pugrenderPopup"})
);
console.log(" -> DONE");