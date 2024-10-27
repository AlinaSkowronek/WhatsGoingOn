function initMap() {
    const location = { lat: 40.0067984, lng: -105.265396 };
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: location
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const apiKey = document.getElementById('map').getAttribute('apiKey');
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = function () {
            console.error('Failed to load the Google Maps API script.');
            document.getElementById('map').innerHTML = "<p>Some error has occured. Try configuring your browser settings (you can do this by going to by clicking on the i to the left of localhost:3000</p>";
        };
        document.head.appendChild(script);
    }
});