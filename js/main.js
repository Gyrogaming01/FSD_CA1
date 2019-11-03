window.onload = onAllAssetsLoaded;
document.write("<div id='loadingMessage'>Loading...</div>");

let mapObj = null;
let mapWindow = null;

let directionsDisplay = null;
let directionsService = null;

async function onAllAssetsLoaded() {
    // hide the webpage loading message
    document.getElementById("loadingMessage").style.visibility = "hidden";

    init();
    await displayMap();
}

function init()
{
    mapObj = new google.maps.Map(document.getElementById("mapDiv"), {
        zoom: 6,
        center: new google.maps.LatLng(38.4, 137.252354),
        mapTypeId: google.maps.MapTypeId.HYBRID
    });

    mapWindow = new google.maps.InfoWindow();

    new google.maps.places.Autocomplete($('#dir_start').get(0));
    new google.maps.places.Autocomplete($('#dir_end').get(0));

    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    directionsDisplay.setMap(mapObj);
}

async function displayMap() {
    let locations_url = "./data/locations.json";

    let response = await fetch(locations_url, {
        method: "GET",
        headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
    });

    updateWebpage(await response.json());
}

function updateWebpage(response) {
    let icons = {
        rugby: {
            url: "./img/icons/rugby.svg",
            scaledSize: new google.maps.Size(30, 30)
        },
        flight: {
            url: "./img/icons/flight.svg",
            scaledSize: new google.maps.Size(30, 30)
        }
    };

    let animations = {
        drop: google.maps.Animation.DROP,
        bounce: google.maps.Animation.BOUNCE
    };

    let locations = [];
    for (let i = 0; i < response.length; i++) {
        let location = response[i];
        locations.push({
            position: new google.maps.LatLng(
                location["position"][0],
                location["position"][1]
            ),
            content: createInfoBubble(
                location["title"],
                location["content"],
                location["image"]
            ),
            icon: icons[location["icon"]],
            animation: animations[location["animation"]],
            title: location["title"]
        });
    }

    for (let i = 0; i < locations.length; i++) {
        addMarker(mapWindow, mapObj, locations[i]);
    }
}

async function getNearby(name) {
    let locations_url = "./data/locations.json";

    let response = await fetch(locations_url, {
        method: "GET",
        headers: {
            "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
    });

    let json = await response.json();

    let locations = [];
    for (let i = 0; i < json.length; i++) {
        let location = json[i];
        locations.push({
            lat: location["position"][0],
            lng: location["position"][1],
            title: location["title"]
        });
    }

    for (let i = 0; i < locations.length; i++) {
        if (name == locations[i].title) {
            let services_centre_location = {
                lat: locations[i].lat,
                lng: locations[i].lng
            };

            let service = new google.maps.places.PlacesService(mapObj);

            let types = ["cafe", "restaurant", "bar", "lodging"];

            for (let i = 0; i < types.length; i++) {
                service.nearbySearch(
                    {
                        location: services_centre_location,
                        radius: 1000,
                        type: [types[i]]
                    },
                    getNearbyServicesMarkers
                );
            }

            function getNearbyServicesMarkers(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    service = new google.maps.places.PlacesService(mapObj);
                    
                    for (let i = 0; i < results.length; i++) {
                        let request = {
                            placeId: results[i].place_id
                        };
                        service.getDetails(request, createServiceMarker);
                    }
                }
            }

            function createServiceMarker(place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK){
                    let marker = {
                        position: place.geometry.location,
                        content: createServiceBubble(
                            place
                        ),
                        icon: {
                            url: place.icon,
                            scaledSize: new google.maps.Size(30, 30)
                        },
                        animation: null,
                        title: place.name,
                        place: place
                    };
                    addMarker(mapWindow, mapObj, marker);
                }
            }
        }
    }
}

async function getDirections(name) {
    $('#dir_end').val(name);
    $('#dir_start').focus();
}

function calcDirections() {
    let start = $('#dir_start').val();
    let end = $('#dir_end').val();

    if(start == "") {
        showError("Directions: Start point not selected!");
        return;
    }
    if(end == "") {
        showError("Directions: End point not selected!");
        return;
    }

    let mode = $('input[name=transportMode]:checked').val();
    if(mode == "walk") {
        mode = google.maps.TravelMode.WALKING;
    }
    else if(mode == "drive") {
        mode = google.maps.TravelMode.DRIVING;
    }
    else if(mode == "transit") {
        mode = google.maps.TravelMode.TRANSIT;
    }
    else {
        showError("Directions: Travel mode not selected!");
        return;
    }

    let request = {
        origin: start,
        destination: end,
        travelMode: mode
    };

    directionsService.route(request, function (response, status){
        if (status == google.maps.DirectionsStatus.OK)
        {
            directionsDisplay.setDirections(response);
        }
    });
}

function addMarker(window, map, location) {
    let location_marker = new google.maps.Marker({
        position: location.position,
        icon: location.icon,
        scaledSize: location.scaledSize,
        content: location.content,
        animation: location.animation,
        title: location.title,
        map: map
    });

    if("place" in location) {
        google.maps.event.addListener(
            location_marker,
            "click",
            (function(location_marker, location) {
                return function() {
                    window.setContent(location.content);
                    window.open(map, location_marker);
                    openInfoScreen(location.place);
                };
            })(location_marker, location)
        );
    } else {
        google.maps.event.addListener(
            location_marker,
            "click",
            (function(location_marker, location) {
                return function() {
                    window.setContent(location.content);
                    window.open(map, location_marker);
                    openInfoScreen(null);
                };
            })(location_marker, location)
        );
    }
}

function createInfoBubble(title, content, image) {
    return `<div id="marker" style="background-image:url(${image})">
        <div id="content">
            <h1>${title}</h1>
            <p class="text">${content}</p>
            <div class="options">
                <button onclick="getNearby('${title}')">
                    <i class="material-icons">map</i>
                </button>
                <button onclick="getDirections('${title}')">
                    <i class="material-icons">directions</i>
                </button>
            </div>
        </div>
    </div>`;
}

function createServiceBubble(place) {
    let isOpen = `<i class="material-icons">mood_bad</i> Could not find opening hours.`;
    if("opening_hours" in place && "open_now" in place.opening_hours) {
        if(place.opening_hours.open_now) {
            isOpen = `<i class="material-icons">mood</i> Open now!`;
        } else {
            isOpen = `<i class="material-icons">mood_bad</i> Currently closed.`;
        }
    }
    if(place.photos) {
        return`<div id="marker" style="background-image:url(${place.photos[0].getUrl()})">
            <div id="content">
                <h1>${place.name}</h1>
                <p class="text">${place.formatted_address.replace(/, /g,',<br>')}</p>
                <p class="text">${isOpen}</p>
                <div class="options">
                    <button onclick="getDirections('${place.formatted_address}')">
                        <i class="material-icons">directions</i>
                    </button>
                </div>
            </div>
        </div>`;
    };
    return`<div id="marker">
        <div id="content">
            <h1>${place.name}</h1>
            <p class="text">${isOpen}<p>
            <div class="options">
                <button onclick="getDirections('${place.formatted_address}')">
                    <i class="material-icons">directions</i>
                </button>
            </div>
        </div>
    </div>`;
}

function showError(message) {
    let errorString = `
        <div class="alert alert-danger alert-dismissible">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>Error!</strong> ${message}
        </div>
    `;
    $('#errors').append(errorString);
}

function openInfoScreen(place) {
    let infoBox = `<div>`;
    if(place === null) {
        infoBox = `<p>No info found.</p>`;
    } else {
        infoBox = infoBox.concat(`<h1>${place.name}</h1>`);
        if(place.photos) {
            infoBox = infoBox.concat(`
            <div id="images-${place.name}" class="carousel slide" data-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <img src="${place.photos[0].getUrl()}">
                    </div>
                    ${function() {
                        let str = "";
                        for(let i=1;i<place.photos.length;i++) {
                            str = str.concat(`
                            <div class="carousel-item">
                                <img src="${place.photos[i].getUrl()}">
                            </div>
                            `)
                        }
                        return str;
                    }()}
                </div>
                <a class="carousel-control-prev" href="#images-${place.name}" data-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </a>
                <a class="carousel-control-next" href="#images-${place.name}" data-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </a>
            </div>
            <br>
            `)
        }
        let isOpen = `<i class="material-icons">mood_bad</i> Could not find opening hours.`;
        if("opening_hours" in place) {
            let days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
            let times = `
            <table class="table table-striped">
                <thead>
                <tr>
                    <th>Day</th>
                    <th>Time</th>
                </tr>
                </thead>
                <tbody>
                    ${function() {
                        let str = "";
                        for (let i=0;i<days.length;i++) {
                            str = str.concat(`
                            <tr>
                                <td>${days[i]}</td>
                                <td>${place.opening_hours.weekday_text[i].match(/(?:\w*: )(.*)/)[1]}</td>
                            </tr>
                            `);
                        }
                        return str;
                    }()}
                </tbody>
            </table>
            `;
            isOpen = times;
            if(place.opening_hours.open_now) {
                isOpen = isOpen.concat(`<i class="material-icons">mood</i> Open now!`);
            } else {
                isOpen = isOpen.concat(`<i class="material-icons">mood_bad</i> Currently closed.`);
            }
        }
        infoBox = infoBox.concat(isOpen);
        infoBox = infoBox.concat(`<p>Address:<br>${place.formatted_address.replace(/, /g,',<br>')}</p><rb>`)
        infoBox = infoBox.concat(`<p>Website:<br><a href="${place.website}">${place.website}</a></p>`)
    }
    infoBox = infoBox.concat('</div>');
    $('#info').html(infoBox);
}