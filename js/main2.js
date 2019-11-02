window.onload = onAllAssetsLoaded;
document.write("<div id='loadingMessage'>Loading...</div>");

let infoeBoxes = [];

async function onAllAssetsLoaded() {
    // hide the webpage loading message
    document.getElementById("loadingMessage").style.visibility = "hidden";

    await displayMap();
}

async function displayMap() {
    // These constants must start at 0
    // These constants must match the data layout in the 'locations' array below

    let locations_url = "./data/locations.json"
    let url_params = "";

    // try {
        let response = await fetch(locations_url,
            {
                method: "POST",
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: url_params
            });
        
        //alert("Data:\n"+await response.text());

        updateWebpage(await response.json());
    // } catch (error) {
    //     alert("Fetch failed:\n" + error)
    // }
}

function updateWebpage(response) {
    // let locations = [
    //     {
    //         position: new google.maps.LatLng(53.841557748792376, -6.431400775909425),
    //         content: '<div id="marker"><div id="content"><h1>Test heading</h1><p class="text">bespoke irony whatever art party Brooklyn farm-to-table slow-carb Carles cred mlkshk wolf actually flexitarian Truffaut asymmetrical Portland jean shorts shabby chic Bushwick gentrify blog Neutra letterpress street art bicycle rights dreamcatcher twee Schlitz keytar viral synth you probably haven\'t heard of them beard Vice heirloom fanny pack YOLO</p></div></div>',
    //         icon: icons.rugby,
    //         animation: google.maps.Animation.DROP,
    //         title: "Test"
    //     },
    // ];

    let CONTENT = 0;
    let LATITUDE = 1;
    let LONGITUDE = 2;

    let icons = {
        rugby: {
            url: "./img/icons/rugby.svg",
            scaledSize: new google.maps.Size(30, 30)
        }
    }

    let animations = {
        drop: google.maps.Animation.DROP,
        bounce: google.maps.Animation.BOUNCE
    }

    let locations = [];
    for(let i=0;i<response.length;i++) {
        let location = response[i];
        locations.push({
            position: new google.maps.LatLng(location['position'][0], location['position'][1]),
            content: createInfoBubble(location['title'], location['content'], location['image']),
            icon: icons[location['icon']],
            animation: animations[location['animation']],
            title: location['title']
        });
    }

    let dkit_map = new google.maps.Map(document.getElementById("mapDiv"), {
        zoom: 7,
        center: new google.maps.LatLng(53.5, -7.77832031),
        mapTypeId: google.maps.MapTypeId.HYBRID
    });

    let location_marker;
    let mapWindow = new google.maps.InfoWindow();

    for (let i = 0; i < locations.length; i++) {
        addMarker(mapWindow, dkit_map, locations[i], i)
    }
}

function addMarker(window, map, location, zIndex) {
    let location_marker = new google.maps.Marker({
        position: location.position,
        icon: location.icon,
        // content: location.content,
        animation: location.animation,
        title: location.title,
        map: map,
        zIndex: zIndex
    })

    let infobox = new InfoBox(
        {
            content: location.content,
            disableAutoPan: false,
            pixelOffset: new google.maps.Size(-55, -195),
            boxStyle: 
            {
                opacity: 1,
                width: "350px"
            },
            closeBoxMargin: "20px 20px 0px 0px",
            closeBoxURL: "img/close_icon.png",
            infoBoxClearance: new google.maps.Size(1, 1)
        }
    )

    google.maps.event.addListener(
        location_marker,
        "click",
        (function(infobox, map) {
            return function() {
                infobox.open(map, this);
            };
        })(infobox, map)
    );
}

function createInfoBubble(title, content, image) {
    return `<div id="marker" style="background-image:url(${ image })">
        <div id="content">
            <h1>${ title }</h1>
            <p class="text">${ content }</p>
        </div>
    </div>`
}

// function displayMap() {
//     // These constants must start at 0
//     // These constants must match the data layout in the 'locations' array below
//     let CONTENT = 0;
//     let LATITUDE = 1;
//     let LONGITUDE = 2;
//     let locations = [
//         ["House", 53.841557748792376, -6.431400775909425]
//     ];

//     let dkit_map = new google.maps.Map(document.getElementById("mapDiv"), {
//         zoom: 7,
//         center: new google.maps.LatLng(53.5, -7.77832031),
//         mapTypeId: google.maps.MapTypeId.HYBRID
//     });

//     let location_marker;
//     let mapWindow = new google.maps.InfoWindow();

//     for (let i = 0; i < locations.length; i++) {
//         location_marker = new google.maps.Marker({
//             position: new google.maps.LatLng(
//                 locations[i][LATITUDE],
//                 locations[i][LONGITUDE]
//             ),
//             map: dkit_map
//         });

//         google.maps.event.addListener(
//             location_marker,
//             "click",
//             (function(location_marker, i) {
//                 return function() {
//                     mapWindow.setContent(locations[i][CONTENT]);
//                     mapWindow.open(dkit_map, location_marker);
//                 };
//             })(location_marker, i)
//         );
//     }
// }