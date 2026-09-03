/* ===== SAVEUR — Geolocation & Geocoding ===== */
const Geo = (() => {

  let userCoords = null; // { lat, lng }

  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Sin GPS'));
      navigator.geolocation.getCurrentPosition(
        pos => {
          userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(userCoords);
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function getCached() { return userCoords; }

  // Geocode address → { lat, lng, display }
  async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = await res.json();
    if (!data.length) throw new Error('No encontrada');
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name
    };
  }

  // Reverse geocode coords → address string
  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  // Distance in km between two coords
  function distance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }

  return { getUserLocation, getCached, geocodeAddress, reverseGeocode, distance, formatDistance };
})();
