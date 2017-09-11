const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug');
const path = require('path');
const fs = require('fs');

const flickr = require('./libs/flickr.js');
const gvision = require('./libs/gvision.js');

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

router.post("/annotate/:image_url", (req, res) => {
    console.log(`POST /annotate/${req.params.image_url}`);
    gvision.annotate(req.params.image_url, (annotations) => {
        res.json(annotations);
        res.end();
    });
});

app.use(router);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Generate and write client-side js PUG templates...
console.log("Writing PUG templates...");
fs.writeFile(
    "public/javascripts/pugtemplates.js",
    pug.compileFileClient("views/templates/popup.pug", {name: "pugrenderPopup"}));
console.log(" -> DONE");