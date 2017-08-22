var map;
var markers;
var sideimages;
var noresults;
var btnSeeMore;

window.onload = function() {
    map = L.map('map', {
        center: [0, 30],
        zoom: 2.5,
        zoomSnap: 0.05
    });

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibmVjcm9ieXRlIiwiYSI6ImNpb2wycXRybzAwM2x1eG0xNnQ3dXVvZzcifQ.pGatEbiyoc6HmJoQHdYGwg'
    }).addTo(map);

    markers = L.featureGroup().addTo(map);
    map.zoomControl.setPosition('topright');

    sideimages = document.getElementById("sideimages");
    noresults = document.getElementById("noresults");
    btnSeeMore = document.getElementById("btnSeeMore");

    // map.locate({
    //     setView: true
    // });
}

var lastReq = {};

function search(tags, page, keyoverride) {
    if (!keyoverride && event.keyCode != 13) {
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
            processResponse(rsp, false, () => {
                isLoading(false);
            });
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
        success: (rsp) => {
            lastReq = req;
            processResponse(rsp, true, () => {
                isLoading(false);
            });
        }
    });
}

function processResponse(rsp, scrollToBottom, callback) {
    function clearImages() {
        while(sideimages.lastChild) {
            sideimages.removeChild(sideimages.lastChild);
        }
        markers.clearLayers();
    }
    
    if (!rsp) {
        clearImages();
        btnSeeMore.style.visibility = "hidden";
        noresults.style.visibility = "visible";
        callback();
    } else {
        noresults.style.visibility = "hidden";

        var numImages = rsp.photos.length;
        var imagesLoaded = 0;

        if (rsp.page == 1) {
            clearImages();
            btnSeeMore.style.visibility = "visible";
        }

        for (i = 0; i < numImages; i++) {
            var img = document.createElement("img");
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded == numImages) {
                    callback();
                    if (scrollToBottom) {
                        $("#sideimages").animate({scrollTop: sideimages.scrollHeight}, 1500);
                    }
                }
            }
            img.src = rsp.photos[i].url_q;
            sideimages.appendChild(img);
    
            var icon = L.icon({
                iconUrl: rsp.photos[i].url_q,
                iconSize: [50, 50]
            });
    
            var marker = L.marker([rsp.photos[i].lat, rsp.photos[i].lon], {icon: icon}).addTo(markers);
        }
    
        map.fitBounds(markers.getBounds(), {
            paddingTopLeft: [350 + 30, 30],
            paddingBottomRight: [30, 30]
        });
    }
}

function btnSearch_OnClick() {
    search(document.getElementById("searchbox").value, 1, true);
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
        document.getElementById("searchbox").blur();
        document.getElementById("overlay").style.visibility = "visible";
        document.getElementById("loader").style.visibility = "visible";
    } else {
        document.getElementById("searchbox").focus();
        document.getElementById("overlay").style.visibility = "hidden";
        document.getElementById("loader").style.visibility = "hidden";
    }
}