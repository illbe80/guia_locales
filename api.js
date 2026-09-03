/* ===== SAVEUR — Online Data Fetching ===== */
/* Uses Nominatim (OSM) + Overpass API — no API key needed */

const API = (() => {

  // Search for places by name using Nominatim
  async function searchPlaces(query, city = '') {
    const q = city ? `${query}, ${city}` : query;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&extratags=1&namedetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) throw new Error('Error de red');
    const data = await res.json();
    return data
      .filter(r => r.class === 'amenity' || r.class === 'tourism' || r.class === 'shop' || r.type === 'restaurant' || r.type === 'cafe' || r.type === 'bar' || r.type === 'pub' || r.type === 'fast_food')
      .map(r => ({
        osmId:    r.osm_id,
        osmType:  r.osm_type,
        name:     r.namedetails?.name || r.display_name.split(',')[0],
        address:  buildAddress(r.address),
        lat:      parseFloat(r.lat),
        lng:      parseFloat(r.lon),
        type:     r.type,
        extratags: r.extratags || {}
      }));
  }

  // Get detailed info from Overpass for an OSM node/way
  async function getDetails(osmType, osmId) {
    const t = osmType === 'node' ? 'node' : osmType === 'way' ? 'way' : 'relation';
    const query = `[out:json];${t}(${osmId});out tags;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Overpass error');
    const data = await res.json();
    const el = data.elements?.[0];
    if (!el) return null;
    const tags = el.tags || {};

    return {
      phone:    tags.phone || tags['contact:phone'] || '',
      website:  tags.website || tags['contact:website'] || '',
      hours:    formatHours(tags.opening_hours),
      cuisine:  tags.cuisine ? tags.cuisine.replace(/_/g,' ').replace(/;/g,', ') : '',
      priceRange: derivePriceRange(tags),
      rating:   '',  // OSM doesn't have ratings
      wheelchair: tags.wheelchair || '',
      outdoor:  tags.outdoor_seating === 'yes',
      delivery: tags.delivery === 'yes',
      takeaway: tags.takeaway === 'yes',
    };
  }

  function buildAddress(addr) {
    if (!addr) return '';
    const parts = [];
    if (addr.road) parts.push(`${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}`);
    if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    return parts.join(', ');
  }

  function formatHours(raw) {
    if (!raw) return '';
    // Simplify common patterns
    return raw.replace(/Mo,Tu,We,Th,Fr/g, 'Lun-Vie')
              .replace(/Mo-Fr/g, 'Lun-Vie')
              .replace(/Sa,Su/g, 'Sáb-Dom')
              .replace(/Sa-Su/g, 'Sáb-Dom')
              .replace(/Mo-Su/g, 'Lun-Dom')
              .replace(/off/g, 'cerrado');
  }

  function derivePriceRange(tags) {
    const p = tags['price:range'] || tags.price_range || '';
    if (p.includes('1') || p === '$')   return '€ (económico)';
    if (p.includes('2') || p === '$$')  return '€€ (moderado)';
    if (p.includes('3') || p === '$$$') return '€€€ (caro)';
    if (p.includes('4'))                return '€€€€ (muy caro)';
    return '';
  }

  return { searchPlaces, getDetails };
})();
