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
        sidebar: document.getElementById("sidebar"),
        sideimages: document.getElementById("sideimages"),
        noresults: document.getElementById("noresults"),
        btnSeeMore: document.getElementById("btnSeeMore"),
        searchbox: document.getElementById("searchbox"),
        sort: document.getElementById("sort"),
        overlay: document.getElementById("overlay"),
        loader: document.getElementById("loader")
    };
}

function search(text, page, keyoverride) {
    if (!keyoverride && event.keyCode != 13) {
        return;
    }
    loadingOverlay(DOM.sidebar, true);
    $.ajax(req = {
        url: "/imagesearch",
        method: "POST",
        data: {
            text: text,
            sort: getSelectedSort(),
            page: 1,
            per_page: getPerPage()
        },
        success: (rsp) => {
            lastReq = req.data;
            processResponse(rsp, false, () => {
                loadingOverlay(DOM.sidebar, false);
            });
        }
    });
}

function loadMore() {
    loadingOverlay(DOM.sidebar, true);
    $.ajax(req = {
        url: "/imagesearch",
        method: "POST",
        data: {
            text: lastReq.text,
            sort: lastReq.sort,
            page: lastReq.page + 1,
            per_page: getPerPage()
        },
        success: (rsp) => {
            lastReq = req.data;
            processResponse(rsp, true, () => {
                loadingOverlay(DOM.sidebar, false);
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

        if (rsp.page === rsp.pages) {
            DOM.btnSeeMore.style.visibility = "hidden";
        }

        let photoInfoRetrieved = [];

        for (i = 0; i < numImages; i++) {
            let p = rsp.photos[i];
            let imgcontainer = document.createElement('div');
            imgcontainer.className = "sideimagediv";
            let img = document.createElement("img");

            img.src = p.url_q;
            img.onload = (e) => {
                e.target.parentElement.style.display = "inline-block";
                imagesLoaded++;
                if (imagesLoaded == numImages) {
                    callback();
                    if (scrollToBottom) {
                        $("#sideimages").animate({scrollTop: DOM.sideimages.scrollHeight}, 1500);
                    }
                }
            }
            
            imgcontainer.onclick = () => {
                marker.fire("click");
            }

            imgcontainer.appendChild(img);
            DOM.sideimages.appendChild(imgcontainer);
    
            let icon = L.divIcon({
                iconSize: [50, 50],
                html: `<img src=${p.url_q}>`
            });
    
            let marker = L.marker([p.lat, p.lon], {icon: icon}).addTo(markers);

            var loading = false;
            marker.on("click", (e) => {
                if (loading === true || photoInfoRetrieved.indexOf(p.photo_id) !== -1) {
                    return;
                }
                loadingOverlay(imgcontainer, true);
                loadingOverlay(e.target.getElement(), true);
                loading = true;
                
                $.ajax(`/photo/${p.photo_id}`, {
                    method: "POST",
                    success: (photoInfo) => {
                        photoInfoRetrieved.push(p.photo_id);

                        let popup = L.popup({
                            autoPanPaddingTopLeft: [370, 10],
                            autoPanPaddingBottomRight: [10, 10],
                            minWidth: 500,
                            maxWidth: 500
                        });

                        popup.setContent(pugrenderPopup({
                            image_url: p.url,
                            title: photoInfo.title,
                            description: photoInfo.description,
                            ownername: photoInfo.owner.name,
                            profileurl: photoInfo.owner.profileurl,
                            buddyicon: photoInfo.owner.buddyicon
                        }));

                        marker.bindPopup(popup).openPopup();

                        loadingOverlay(imgcontainer, false);
                        loadingOverlay(e.target.getElement(), false);
                        loading = false;
                    }
                });
            });
        }
        
        // Display markers only when images have finished loading.
        let DOMmarkers = document.getElementsByClassName("leaflet-marker-icon");
        for(i = 0; i < DOMmarkers.length; i++) {
            DOMmarkers.item(i).firstChild.onload = (e) => {
                e.target.parentElement.style.display = "block";
            };
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

function loadingOverlay(element, on) {
    if (on) {
        let overlay = document.createElement('div');
        overlay.className = "overlay";
        let img = document.createElement('img');
        img.className = "loader";
        img.src = "/images/loading.gif";
        overlay.appendChild(img);
        element.appendChild(overlay);
    } else {
        element.removeChild(element.lastChild);
    }
}