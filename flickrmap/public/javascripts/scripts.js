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

    markers = L.featureGroup().addTo(map);

    // map.locate({
    //     setView: true
    // });
}

var lastReq = {};

function search(tags, page) {
    if (event.keyCode != 13) {
        return;
    }
    isLoading(true);
    $.ajax(req = {
        method: "POST",
        data: {
            tags: tags,
            sort: getSelectedSort(),
            page: 1,
            per_page: getPerPage()
        },
        success: (rsp) => {
            lastReq = req;
            processResponse(rsp);
            isLoading(false);
        }
    });
}

function loadMore() {
    isLoading(true);
    $.ajax(req = {
        method: lastReq.method,
        data: {
            tags: lastReq.data.tags,
            sort: lastReq.data.sort,
            page: lastReq.data.page + 1,
            per_page: getPerPage()
        },
        success: (photos) => {
            lastReq = req;
            processResponse(photos, true);
            isLoading(false);
        }
    });
}

function processResponse(rsp, scrollToBottom) {
    var imageDiv = document.getElementById("sideimages");
    var noResults = document.getElementById("noresults");
    var btnSeeMore = document.getElementById("btnSeeMore");
    var photos = rsp.photos;

    if (rsp.page == 1) {
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

    map.fitBounds(markers.getBounds(), {
        
    });

    if (scrollToBottom) {
        $("#sideimages").animate({scrollTop: imageDiv.scrollHeight}, 1500);
    }
}

function getPerPage() {
    var columns = 2;
    return columns * Math.floor(document.getElementById("sideimages").clientHeight / 158);
}

function getSelectedSort() {
    var e = document.getElementById("sort")
    return e.options[e.selectedIndex].value;
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