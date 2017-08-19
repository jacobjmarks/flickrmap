var map;
var markers;

window.onload = function() {
    map = L.map('map').setView([0, 30], 2.5);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibmVjcm9ieXRlIiwiYSI6ImNpb2wycXRybzAwM2x1eG0xNnQ3dXVvZzcifQ.pGatEbiyoc6HmJoQHdYGwg'
    }).addTo(map);

    markers = L.layerGroup().addTo(map);
}

function getPerPage() {
    var rows = 2;
    return rows * Math.floor(document.getElementById("sideimages").clientHeight / 158);
}

var lastRequest = {};

function search(tags, page) {
    isLoading(true);
    var request = {
        method: "POST",
        url: "/",
        data: {
            tags: tags,
            page: 1,
            per_page: getPerPage()
        },
        success: (photos) => {
            isLoading(false);
            lastRequest = request;
            processSearch(photos);
        }
    };
    $.ajax(request);
}

function processSearch(photos, scrollToBottom) {
    var imageDiv = document.getElementById("sideimages");
    var noResults = document.getElementById("noresults");
    var btnSeeMore = document.getElementById("btnSeeMore");

    if (lastRequest.data.page == 1) {
        while(imageDiv.lastChild.nodeName == "IMG") {
            imageDiv.removeChild(imageDiv.lastChild);
        }
        markers.clearLayers();
        btnSeeMore.style.visibility = "visible";
    }

    if (!photos) {
        btnSeeMore.style.visibility = "hidden";
        noResults.style.visibility = "visible";
        return;
    } else {
        noResults.style.visibility = "hidden";
    }

    for (i = 0; i < photos.length; i++) {
        var img = document.createElement("img");
        img.src = photos[i].url;
        imageDiv.appendChild(img);

        var icon = L.icon({
            iconUrl: photos[i].url,
        });

        var marker = L.marker([photos[i].lat, photos[i].lon], {icon: icon}).addTo(markers);
    }

    if (scrollToBottom) {
        $("#sideimages").animate({scrollTop: imageDiv.scrollHeight}, 1500);
    }
}

function loadMore() {
    isLoading(true);
    var request = {
        method: lastRequest.method,
        url: lastRequest.url,
        data: {
            tags: lastRequest.data.tags,
            page: lastRequest.data.page + 1,
            per_page: getPerPage()
        },
        success: (photos) => {
            isLoading(false);
            lastRequest = request;
            processSearch(photos, true);
        }
    };
    $.ajax(request);
}

function isLoading(isLoading) {
    if (isLoading) {
        document.getElementById("overlay").style.visibility = "visible";
        document.getElementById("loader").style.visibility = "visible";
    } else {
        document.getElementById("overlay").style.visibility = "hidden";
        document.getElementById("loader").style.visibility = "hidden";
    }
}