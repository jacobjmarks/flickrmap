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
    
    // map.locate({
    //     setView: true
    // });

    // Assign relevant DOM elements.
    DOM = {
        sideimages: document.getElementById("sideimages"),
        noresults: document.getElementById("noresults"),
        btnSeeMore: document.getElementById("btnSeeMore"),
        searchbox: document.getElementById("searchbox"),
        sort: document.getElementById("sort"),
        overlay: document.getElementById("overlay"),
        loader: document.getElementById("loader")
    };
}

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
        while(DOM.sideimages.lastChild) {
            DOM.sideimages.removeChild(DOM.sideimages.lastChild);
        }
        markers.clearLayers();
    }
    
    if (!rsp) {
        clearImages();
        DOM.btnSeeMore.style.visibility = "hidden";
        DOM.noresults.style.visibility = "visible";
        callback();
    } else {
        DOM.noresults.style.visibility = "hidden";

        let numImages = rsp.photos.length;
        let imagesLoaded = 0;

        if (rsp.page == 1) {
            clearImages();
            DOM.btnSeeMore.style.visibility = "visible";
        }

        for (i = 0; i < numImages; i++) {
            let p = rsp.photos[i];
            let img = document.createElement("img");
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded == numImages) {
                    callback();
                    if (scrollToBottom) {
                        $("#sideimages").animate({scrollTop: DOM.sideimages.scrollHeight}, 1500);
                    }
                }
            }
            img.src = p.url_q;
            DOM.sideimages.appendChild(img);
    
            let icon = L.icon({
                iconUrl: p.url_q,
                iconSize: [50, 50]
            });
    
            let marker = L.marker([p.lat, p.lon], {icon: icon});
            marker.addTo(markers);

            img.onclick = () => {
                marker.openPopup();
            }

            L.DomEvent.addListener(marker, "click", (event) => {
                $.ajax(`/user/${p.user_id}`, {
                    method: "POST",
                    success: (user) => {
                        marker.bindPopup(L.popup({
                            autoPanPaddingTopLeft: [370, 10],
                            autoPanPaddingBottomRight: [10, 10],
                            minWidth: 500,
                            maxWidth: 500
                        }).setContent(pugrenderPopup({
                            image_url: p.url,
                            title: p.title,
                            name: user.name,
                            buddyicon:
                                (user.iconserver > 0) ?
                                    `http://farm${user.iconfarm}.staticflickr.com/${user.iconserver}/buddyicons/${user.nsid}.jpg`
                                    :
                                    "https://www.flickr.com/images/buddyicon.gif"
                        }))).openPopup();
                    }
                });
            });
        }
    
        map.fitBounds(markers.getBounds(), {
            paddingTopLeft: [350 + 30, 30],
            paddingBottomRight: [30, 30]
        });
    }
}

function btnSearch_OnClick() {
    search(DOM.searchbox.value, 1, true);
}

function getPerPage() {
    const columns = 2;
    let rows = Math.floor(DOM.sideimages.clientHeight / 160);
    return columns * rows;
}

function getSelectedSort() {
    return DOM.sort.options[DOM.sort.selectedIndex].value;
}

function isLoading(isLoading) {
    if (isLoading) {
        DOM.searchbox.blur();
        DOM.overlay.style.visibility = "visible";
        DOM.loader.style.visibility = "visible";
    } else {
        DOM.searchbox.focus();
        DOM.overlay.style.visibility = "hidden";
        DOM.loader.style.visibility = "hidden";
    }
}