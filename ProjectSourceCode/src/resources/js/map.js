let markersArray = [];
let map;
let currentInfoWindow = null;
let currentCreateEventMarker = null;

function formatDateTime(isoString) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    };
    return new Date(isoString).toLocaleDateString('en-US', options);
}

/**
 * Initialize the info window for a marker. 
 * @param {Object} markerData - Data associated with the marker.
 * @returns {InfoWindow} 
 */

function initInfoWindow(markerData) {
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                color: #333;
                padding: 10px;
                border-radius: 8px;
                background-color: #fff;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                max-width: 350px;
                overflow-wrap: break-word;
                max-height: 500px;">

                <h2 style="
                    margin: 0 0 12px 0;
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;">
                    ${markerData.event_name}
                </h2>

                <div style="
                    border: 1px solid #ddd;
                    padding: 12px;
                    border-radius: 8px;
                    background-color: #f9f9f9;">
                    <p style="margin: 0 0 10px 0;">
                        <strong>Description:</strong><br>
                        ${markerData.event_description}
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <strong>Date Created:</strong><br>
                        ${formatDateTime(markerData.created_date)}
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <strong>Start Time:</strong><br>
                        ${formatDateTime(markerData.event_start)}
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <strong>End Time:</strong><br>
                        ${formatDateTime(markerData.event_end)}
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <strong>Location:</strong><br>
                        ${markerData.event_location}
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <strong>Organizers:</strong><br>
                        ${markerData.event_organizers}
                    </p>
                    <p style="margin: 0;">
                        <strong>Event Type:</strong><br>
                        ${markerData.event_type}
                    </p>
                </div>
            </div>
        `,
        maxWidth: 350,
        maxHeight: 500
    });

    // Add event listener for the closeclick event
    infoWindow.addListener('closeclick', () => {
        if (currentInfoWindow === infoWindow) {
            currentInfoWindow = null;
        }
    });

    return infoWindow;
}

/**
 * Assigns a color to a marker based on the event type. Used for pin color.
 * @param {JSON} markerData - Data associated with the marker.
 * @returns {string} - The color of the marker.
 */

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

/**
 * Initialize the info window for a marker.
 * @param {Object} mapInstance - Data associated with the marker.
 */

async function instantiateMarker(mapInstance, markerData) {
    const PinElement = await loadPinElement();
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

    marker.addListener('click', (event) => {
        event.stop(); // Prevent default behavior
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        infoWindow.open(mapInstance, marker);
        currentInfoWindow = infoWindow;
    });

    markersArray.push(marker);
}

function instantiateMarkers(mapInstance) {
    const markers = JSON.parse(document.getElementById('map').getAttribute('data-markersAndEvents'));

    markers.forEach(markerData => {
        instantiateMarker(mapInstance, markerData);
    });
}

let createEventMode = false;
const createEventButton = document.getElementById('enterCreateEventMode');

function changeCreateEventMode() {
    if (createEventMode) {
        map.setOptions({ draggable: true });
        createEventMode = false;
        createEventButton.innerHTML = 'Create Event';
        createEventButton.style.backgroundColor = '#4CAF50';
        if (currentCreateEventMarker) {
            currentCreateEventMarker.setMap(null);
            currentCreateEventMarker = null;
        }
    }
    else {
        map.setOptions({ draggable: false });
        createEventMode = true;
        createEventButton.innerHTML = 'Cancel';
        createEventButton.style.backgroundColor = 'red';
    }
}

/**
 * Initialize the Google Map.
 */
function initMap() {
    const location = { lat: 40.0067984, lng: -105.265396 };
    map = new google.maps.Map(document.getElementById('map'), { //Create the map and center it on CU Boulder
        mapId: 'c23ba2a349b55683',
        zoom: 16,
        center: location,
        clickableIcons: false // Make labels not clickable
    });

    instantiateMarkers(map);

    map.addListener('click', (event) => { //Instantiate a marker on click AND confirm
        if (!createEventMode) {
            return;
        }
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: event.latLng,
            map: map,
            title: 'New Marker'
        });

        if (currentCreateEventMarker) {
            currentCreateEventMarker.setMap(null);
        }
        currentCreateEventMarker = marker;

        const confirmButtonId = `confirmButton-${marker.id}`;
        const removeButtonId = `removeButton-${marker.id}`;
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <h3>Create Event Here?</h3>
                <button id="${confirmButtonId}">Confirm</button>
                <button id="${removeButtonId}">Remove</button>
            `,
            disableAutoPan: true
        });

        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const closeButton = document.querySelector('.gm-ui-hover-effect');
            if (closeButton) {
                closeButton.style.display = 'none';
            }
        });

        infoWindow.open(map, marker);

        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const modal = document.getElementById('markerModal');
            const confirmButton = document.getElementById(confirmButtonId);
            confirmButton.addEventListener('click', function () {
                modal.style.display = 'block';
            });
            const removeButton = document.getElementById(removeButtonId);
            removeButton.addEventListener('click', function () {
                marker.setMap(null);
                infoWindow.close();
                currentInfoWindow = null;
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

    createEventButton.addEventListener('click', changeCreateEventMode);

    // Handles open and closing Modal for creating an event and submitting the form

    const modal = document.getElementById('markerModal');

    const eventNameInput = document.getElementById('event_name');
    const eventDateInput = document.getElementById('event_date');
    const eventDescriptionInput = document.getElementById('event_description');
    const eventStartInput = document.getElementById('event_start');
    const eventEndInput = document.getElementById('event_end');
    const eventLocationInput = document.getElementById('event_location');
    const eventOrganizersInput = document.getElementById('event_organizers');
    const eventTypeInput = document.getElementById('event_type');

    document.getElementById('markerForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const position = currentCreateEventMarker.position;
        const latitude = position.lat;
        const longitude = position.lng;
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
            event_location, event_organizers, event_type, latitude, longitude
        };

        fetch('/createEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(markerData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(() => {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                instantiateMarker(map, markerData);
                changeCreateEventMode();
                currentInfoWindow = null;

                eventNameInput.value = '';
                eventDateInput.value = '';
                eventDescriptionInput.value = '';
                eventStartInput.value = '';
                eventEndInput.value = '';
                eventLocationInput.value = '';
                eventOrganizersInput.value = '';
                eventTypeInput.value = '';
            })
            .catch(err => {
                console.error('Error:', err);
            });
        modal.style.display = 'none';
    });

    document.getElementById('closeModal').addEventListener('click', function () {
        modal.style.display = 'none';
        if (currentCreateEventMarker) {
            currentCreateEventMarker.setMap(null);
        }
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        eventNameInput.value = '';
        eventDateInput.value = '';
        eventDescriptionInput.value = '';
        eventStartInput.value = '';
        eventEndInput.value = '';
        eventLocationInput.value = '';
        eventOrganizersInput.value = '';
        eventTypeInput.value = '';
    });
});
