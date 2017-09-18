window.onload = function() {
    // Setup and display the Leafet map...
    map = L.map('map', {
        center: [0, 30],
        zoom: 2.5,
        zoomSnap: 0.05
    });

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution:
            'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>' +
            'contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">' +
            'CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibmVjcm9ieXRlIiwiYSI6ImNpb2wycXRybzAwM2x1eG0xNnQ3dXVvZzcifQ.pGatEbiyoc6HmJoQHdYGwg'
    }).addTo(map);

    markers = L.featureGroup().addTo(map);
    map.zoomControl.setPosition('topright');

    // Assign relevant DOM elements.
    DOM = {
        sidebar: document.getElementById("sidebar"),
        sideimages: document.getElementById("sideimages"),
        noresults: document.getElementById("noresults"),
        btnLoadMore: document.getElementById("btnLoadMore"),
        searchbox: document.getElementById("searchbox"),
        sort: document.getElementById("sort"),
        perpage: document.getElementById("perpage"),
        overlay: document.getElementById("overlay"),
        loader: document.getElementById("loader")
    };
}

/**
 * Function to search for images using the Flickr API given a query string.
 * @param {string} text - The query to search for.
 * @param {int} page - The page of results to request.
 * @param {bool} keyoverride - If false, the user must press enter in
 *                             the searchbox to initiate the search.
 */
function search(text, page, keyoverride) {
    if (!keyoverride && event.keyCode != 13) {
        return;
    }

    loadingOverlay(DOM.sidebar, true);

    // POST the server with the relevent request data to search for images.
    // (Flickr API - flickr.photos.search)
    $.ajax(req = {
        url: "/imagesearch",
        method: "POST",
        data: {
            text: text,
            sort: DOM.sort.options[DOM.sort.selectedIndex].value,
            page: 1,
            per_page: DOM.perpage.value
        },
        error: () => {
            notifyError();
        },
        success: (results) => {
            lastReq = req.data;
            processResults(results);
        },
        complete: () => {
            loadingOverlay(DOM.sidebar, false);
        }

    });
}

/**
 * Function to search for images using the given tag.
 * @param {string} tag - The tag to search for.
 */
function tagSearch(tag) {
    DOM.searchbox.value = tag;
    search(tag, 1, 1);
}

/**
 * Function to search for images using the given location.
 * @param {string} location - The location to search for.
 */
function locationSearch(location) {
    DOM.searchbox.value = location;
    search(location, 1, 1);
}

/**
 * Function to load the next page of search results.
 */
function loadMore() {
    loadingOverlay(DOM.sidebar, true);

    // POST the server with the previous request data,
    // though incrementing the desired page by one.
    // (Flickr API - flickr.photos.search)
    $.ajax(req = {
        url: "/imagesearch",
        method: "POST",
        data: {
            text: lastReq.text,
            sort: lastReq.sort,
            page: lastReq.page + 1,
            per_page: DOM.perpage.value
        },
        error: () => {
            notifyError();
        },
        success: (results) => {
            lastReq = req.data;
            processResults(results);
        },
        complete: () => {
            loadingOverlay(DOM.sidebar, false);
        }
    });
}

/**
 * Function to handle the search results after an image search.
 * @param {JSON Object} results - Object containing the relevent search results.
 */
function processResults(results) {
    let numImages = results.photos.length;

    // If there are no results, clear any current results and display 'no results'.
    if (numImages === 0) {
        clearImages();
        DOM.btnLoadMore.style.visibility = "hidden";
        DOM.noresults.style.visibility = "visible";
        callback();
        return;
    } else {
        DOM.noresults.style.visibility = "hidden";
        DOM.btnLoadMore.style.visibility = "visible";
    }

    // If the results are the first page of a search, clear any current results.
    if (results.page === 1) {
        clearImages();
    }

    // If the results page is equal to the total number of pages,
    // disable the 'load more' button.
    if (results.page === results.pages) {
        DOM.btnLoadMore.style.visibility = "hidden";
    }

    let photoInfoRetrieved = [];
    
    // For each photo...
    for (i = 0; i < numImages; i++) {
        let photo = results.photos[i];

        // Create an img element for the sidebar.
        let img = document.createElement("img");
        img.src = photo.url_q;
        img.onload = (e) => {
            // Display the image when it has finished loading.
            e.target.parentElement.style.display = "inline-block";
        }

        let imgcontainer = document.createElement('div');
        imgcontainer.className = "sideimagediv";
        imgcontainer.appendChild(img);

        // Add the image to the sidebar.
        DOM.sideimages.appendChild(imgcontainer);

        // Create the map marker icon.
        let icon = L.divIcon({
            iconSize: [50, 50],
            html: `<img src=${photo.url_q}>`
        });

        // Add a new marker to the map.
        let marker = L.marker([photo.lat, photo.lon], {icon: icon}).addTo(markers);

        // Synchronise onclick actions for map marker and sidebar image.
        imgcontainer.onclick = () => {
            marker.fire("click");
        }

        var loading = false;

        // Load and display extended photo information when
        // the map marker is clicked (or the sidebar image).
        marker.on("click", (e) => {
            // If currently loading other photo info, or this
            // photo info has already been retrieved, return.
            if (loading === true || photoInfoRetrieved.indexOf(photo.photo_id) !== -1) {
                return;
            }

            // Add relevent loading overlays.
            loadingOverlay(imgcontainer, true);
            loadingOverlay(e.target.getElement(), true);
            loading = true;
            
            // POST the server with the photo id for extended information.
            // (Flickr API - flickr.photos.getInfo)
            $.ajax(`/photo/${photo.photo_id}`, {
                method: "POST",
                error: () => {
                    loadingOverlay(imgcontainer, false);
                    loadingOverlay(e.target.getElement(), false);
                    loading = false;
                    notifyError();
                },
                success: (photoInfo) => {
                    photoInfoRetrieved.push(photo.photo_id);

                    // Create a new popup.
                    let popup = L.popup({
                        autoPanPaddingTopLeft: [370, 10],
                        autoPanPaddingBottomRight: [10, 10],
                        minWidth: 500,
                        maxWidth: 500
                    });

                    // Define the popup content by rendering a pug template
                    // and returning it as a HTML element.
                    let popupContent = (() => {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = pugrenderPopup({
                            photohref: photoInfo.photohref,
                            photourl: photo.url,
                            title: photoInfo.title,
                            description: photoInfo.description,
                            ownername: photoInfo.owner.name,
                            profilehref: photoInfo.owner.profilehref,
                            buddyicon: photoInfo.owner.buddyicon,
                            views: photoInfo.views,
                            comments: photoInfo.comments,
                            favourites: photoInfo.faves,
                            tags: photoInfo.tags,
                            location: photoInfo.location
                        });
                        let content = tempDiv.firstChild;
                        tempDiv.remove();
                        return content;
                    })();

                    // Assign the popup content and open the popup.
                    popup.setContent(popupContent);
                    marker.bindPopup(popup).openPopup();

                    // Remnove relevent loading overlays.
                    loadingOverlay(imgcontainer, false);
                    loadingOverlay(e.target.getElement(), false);
                    loading = false;

                    // POST the server with the photo url to have it annotated.
                    // (Google Vision API)
                    $.ajax(`/annotate/${encodeURIComponent(photo.url)}`, {
                        method: "POST",
                        error: () => {
                            popupContent.getElementsByClassName("gvision")[0].appendChild(
                                (() => {
                                    let errmsg = document.createElement('div');
                                    errmsg.innerHTML = "Error.";
                                    return errmsg;
                                })()
                            );
                        },
                        success: (annotations) => {
                            // Display the annotations on the popup via a pug template.
                            popupContent.getElementsByClassName("gvision")[0].appendChild(
                                (() => {
                                    let tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = pugrenderAnnotations({
                                        landmark: annotations.landmark,
                                        labels: annotations.labels
                                    });
                                    let content = tempDiv.firstChild;
                                    tempDiv.remove();
                                    return content;
                                })()
                            );
                        },
                        complete: () => {                            
                            $(".fa-cog").hide();
                        }
                    })
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

    // Zoom/Scale the map to fit all map markers in view.
    map.fitBounds(markers.getBounds(), {
        paddingTopLeft: [350 + 30, 30],
        paddingBottomRight: [30, 30]
    });
}

/**
 * Function to clear all image search results.
 */
function clearImages() {
    while(DOM.sideimages.lastChild) {
        DOM.sideimages.removeChild(DOM.sideimages.lastChild);
    }
    markers.clearLayers();
}

/**
 * Function to add a loading overlay to a given element.
 * @param {DOM element} element - The DOM element on which to add/remove the overlay.
 * @param {bool} on - If true, display the overlay. Otherwise remove if present.
 */
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
        let overlay = element.getElementsByClassName("overlay") &&
                      element.getElementsByClassName("overlay")[0];
        if (overlay) {
            element.removeChild(overlay);
        }
    }
}

/**
 * Function to notify user of an error.
 */
function notifyError() {
    alert("An error occurred.");
}