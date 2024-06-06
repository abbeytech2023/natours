/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

let mapboxgl;

mapboxgl.accessToken =
  'pk.eyJ1IjoiYXBvZXdhMDEiLCJhIjoiY2x2eGQ4ejFrMjJ4eTJqbnk1dWlrbGI0NiJ9.9uQ0hm58RhbGxVpYXrQu_w';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
});
