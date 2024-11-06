/**
 * Initialize the info window for a marker.
 * @param {Object} map - The Google Map instance.
 * @param {Object} marker - The marker instance.
 * @param {Object} markerData - Data associated with the marker.
 */
function initInfoWindow(map, marker, markerData) {
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <h3>${markerData.event_name}</h3>
            <p>${markerData.event_description}</p>
            <p>${markerData.event_date}</p>
            <p>${markerData.event_start} - ${markerData.event_end}</p>
            <p>${markerData.event_location}</p>
            <p>${markerData.event_organizers}</p>
        `
    });
    return infoWindow;
}

/**
 * Open the modal for creating an event.
 * @param {AdvancedMarkerElement} marker - The marker instance.
 */
function openModal(marker) { //Open event creation modal
    const modal = document.getElementById('markerModal');
    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('date');
    const descriptionInput = document.getElementById('description');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const locationInput = document.getElementById('location');
    const organizersInput = document.getElementById('organizers');

    const position = marker.position;
    const lat = position.lat;
    const lng = position.lng;

    modal.style.display = 'block';

    document.getElementById('markerForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const title = titleInput.value;
        const date = dateInput.value;
        const description = descriptionInput.value;
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const location = locationInput.value;
        const organizers = organizersInput.value;

        fetch('/createEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, date, description, startTime, endTime, location, organizers, lat, lng })
        })
            .then(response => response.json())
            .catch(err => {
                console.error(err);
            });
        modal.style.display = 'none';
    });

    document.getElementById('closeModal').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

/**
 * Instantiate markers on the map.
 * @param {Object} map - The Google Map instance.
 */
function instantiateMarkers(map) {
    const markers = JSON.parse(document.getElementById('map').getAttribute('markers'));
    markers.forEach(markerData => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: markerData.latitude, lng: markerData.longitude },
            map: map,
            title: markerData.title
        });
        const infoWindow = initInfoWindow(map, marker, markerData);

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });
}

/**
 * Initialize the Google Map.
 */
function initMap() {
    const location = { lat: 40.0067984, lng: -105.265396 };
    const map = new google.maps.Map(document.getElementById('map'), { //Create the map and center it on CU Boulder
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
                openModal(marker);
            });
            const removeButton = document.getElementById(removeButtonId);
            removeButton.addEventListener('click', function () {
                marker.setMap(null); 
                infoWindow.close(); 
            });
        });
        /*fetch('/add-marker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'New Marker',
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng()
            })
        })
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
            })*/
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        return;
    }
    const apiKey = document.getElementById('map').getAttribute('apiKey');
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
});