
function initMap() {
    const location = { lat: 58.43344530882086, lng: 8.747931217854964 }; 
    const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: location,
    });

    const marker = new google.maps.Marker({
    position: location,
    map: map,
    title: "Hisøy kirke",
    });

    const infoWindow = new google.maps.InfoWindow({
    content: "<h3>Vielsen</h3><p>Hisøy kirke.</p>",
    });

    marker.addListener("click", () => {
    infoWindow.open(map, marker);
    });

    infoWindow.open(map, marker);
}


