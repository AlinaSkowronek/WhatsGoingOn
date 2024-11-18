let markersArray = [];
let map;

/**
 * Initialize the info window for a marker.
 * @param {Object} markerData - Data associated with the marker.
 */
function initInfoWindow(markerData) {
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <h3>${markerData.event_name}</h3>
            <p>${markerData.event_description}</p>
            <p>${markerData.event_date}</p>
            <p>${markerData.event_start} - ${markerData.event_end}</p>
            <p>${markerData.event_location}</p>
            <p>${markerData.event_organizers}</p>
            <p>${markerData.event_type}</p>
        `
    });
    return infoWindow;
}

/**
 * Open the modal for creating an event.
 * @param {AdvancedMarkerElement} marker - The marker instance.
 */
function openModal(marker, infoWindow) { //Open event creation modal
    const modal = document.getElementById('markerModal');
    const eventNameInput = document.getElementById('event_name');
    const eventDateInput = document.getElementById('event_date');
    const eventDescriptionInput = document.getElementById('event_description');
    const eventStartInput = document.getElementById('event_start');
    const eventEndInput = document.getElementById('event_end');
    const eventLocationInput = document.getElementById('event_location');
    const eventOrganizersInput = document.getElementById('event_organizers');
    const eventTypeInput = document.getElementById('event_type');

    const position = marker.position;
    const latitude = position.lat;
    const longitude = position.lng;

    modal.style.display = 'block';

    document.getElementById('markerForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const event_name = eventNameInput.value;
        const event_date = eventDateInput.value;
        const event_description = eventDescriptionInput.value;
        const event_start = eventStartInput.value;
        const event_end = eventEndInput.value;
        const event_location = eventLocationInput.value;
        const event_organizers = eventOrganizersInput.value;
        const event_type = eventTypeInput.value;

        const markerData = {
             event_name, event_date, event_description, event_start, event_end,
                 event_location, event_organizers, event_type, latitude, longitude };

        fetch('/createEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(markerData)
        })
            .then(response => response.json())
            .then(() => {
                infoWindow.close();
                const newInfoWindow = initInfoWindow(markerData);
                newInfoWindow.open(map, marker);
            })
            .catch(err => {
                console.error(err);
            });
        modal.style.display = 'none';
    });
}

function assignMarkerColor(markerData) {
    const event_type = markerData.event_type;
    let backgroundColor;
    switch (event_type) {
        case 'conference':
            backgroundColor = '#FF0000';
            break;
        case 'meetup':
            backgroundColor = '#00FF00';
            break;
        case 'workshop':
            backgroundColor = '#0000FF';
            break;
        case 'seminar':
            backgroundColor = '#FFFF00';
            break;
        case 'party':
            backgroundColor = '#FF00FF';
            break;
        case 'volunteering':
            backgroundColor = '#00FFFF';
            break;
        default:
            backgroundColor = '#FFFFFF';
    }
    return backgroundColor;
}

// Import the PinElement from the marker library
async function loadPinElement() {
    const { PinElement } = await google.maps.importLibrary("marker");
    return PinElement;
}

async function instantiateMarkers(mapInstance) {
    const markers = JSON.parse(document.getElementById('map').getAttribute('data-markersAndEvents'));
    const PinElement = await loadPinElement();

    markers.forEach(markerData => {
        const backgroundColor = assignMarkerColor(markerData);
        const pinColor = new PinElement({
            background: backgroundColor,
            borderColor: backgroundColor,
            glyphColor: backgroundColor,
            scale: 1
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: markerData.latitude, lng: markerData.longitude },
            map: mapInstance,
            title: markerData.event_name,
            content: pinColor.element
        });

        const infoWindow = initInfoWindow(markerData);

        marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
        });

        markersArray.push(marker);
    });
}

/**
 * Initialize the Google Map.
 */
function initMap() {
    const location = { lat: 40.0067984, lng: -105.265396 };
    map = new google.maps.Map(document.getElementById('map'), { //Create the map and center it on CU Boulder
        mapId: 'c23ba2a349b55683',
        zoom: 16,
        center: location
    });

    instantiateMarkers(map);

    map.addListener('click', (event) => { //Instantiate a marker on click AND confirm
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: event.latLng,
            map: map,
            title: 'New Marker'
        });
        const confirmButtonId = `confirmButton-${marker.id}`;
        const removeButtonId = `removeButton-${marker.id}`;
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <h3>Create Event Here?</h3>
                <button id="${confirmButtonId}">Confirm</button>
                <button id="${removeButtonId}">Remove</button>
            `
        });
        infoWindow.open(map, marker);

        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const confirmButton = document.getElementById(confirmButtonId);
            confirmButton.addEventListener('click', function () {
                openModal(marker, infoWindow);
            });
            const removeButton = document.getElementById(removeButtonId);
            removeButton.addEventListener('click', function () {
                marker.setMap(null);
                infoWindow.close();
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        return;
    }
    const apiKey = mapElement.getAttribute('apiKey');
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onerror = function () {
            console.error('Failed to load the Google Maps API script.');
            mapElement.innerHTML = "<p>Some error has occured. Try configuring your browser settings (you can do this by going to by clicking on the i to the left of localhost:3000</p>";
        };
        document.head.appendChild(script);
    }

    document.getElementById('toggleMarkersOn').addEventListener('click', function () {
        markersArray.forEach(marker => marker.setMap(map));
    });

    document.getElementById('toggleMarkersOff').addEventListener('click', function () {
        markersArray.forEach(marker => marker.setMap(null));
    });
});