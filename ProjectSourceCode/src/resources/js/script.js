function initInfoWindow(map, marker, markerData) {
    const uniqueId = `confirmButton-${markerData.id}`;
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <h3>${markerData.title}</h3>
            <button id="${uniqueId}">Confirm</button>
        `
    });
    infoWindow.open(map, marker);

    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const confirmButton = document.getElementById(uniqueId);
        if (confirmButton) {
            confirmButton.addEventListener('click', function () {
                openModal(markerData);
            });
        } else {
            console.error('Confirm button not found');
        }
    });
}

function openModal(markerData) {
    const modal = document.getElementById('markerModal');
    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('date');
    const descriptionInput = document.getElementById('description');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const locationInput = document.getElementById('location');
    const organizersInput = document.getElementById('organizers');

    titleInput.value = markerData.title || '';
    dateInput.value = markerData.date || '';
    descriptionInput.value = markerData.description || '';
    startTimeInput.value = markerData.startTime || '';
    endTimeInput.value = markerData.endTime || '';
    locationInput.value = markerData.location || '';
    organizersInput.value = markerData.organizers || '';

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

        fetch('/add-marker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, date, description, startTime, endTime, location, organizers })
        })
            .then(response => response.json())
            .catch(error => {
                console.error('Error:', error);
            });
        modal.style.display = 'none';
    });

    document.getElementById('closeModal').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

function initMap() {
    const location = { lat: 40.0067984, lng: -105.265396 };
    const map = new google.maps.Map(document.getElementById('map'), {
        mapId: 'c23ba2a349b55683',
        zoom: 16,
        center: location
    });
    const markers = JSON.parse(document.getElementById('map').getAttribute('markers'));
    markers.forEach(markerData => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: markerData.latitude, lng: markerData.longitude },
            map: map,
            title: markerData.title
        });

        marker.addListener('click', () => {
            initInfoWindow(map, marker, markerData);
        });
    });

    map.addListener('click', (event) => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: event.latLng,
            map: map,
            title: 'New Marker'
        });
        marker.addListener('click', () => {
            initInfoWindow(map, marker, { title: 'New Marker' });
        });
        fetch('/add-marker', {
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
            })
    });
}

document.addEventListener('DOMContentLoaded', function () {
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
            document.getElementById('map').innerHTML = "<p>Some error has occured. Try configuring your browser settings (you can do this by going to by clicking on the i to the left of localhost:3000</p>";
        };
        document.head.appendChild(script);
    }
});