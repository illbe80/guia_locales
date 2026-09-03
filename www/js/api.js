/* ===== SAVEUR — Online Data Fetching ===== */
/* Usa Photon (Komoot) + Nominatim Lookup — sin API key */

const API = (() => {

  const FOOD_AMENITIES = [
    'restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court',
    'biergarten', 'ice_cream', 'bistro', 'wine_bar', 'nightclub'
  ];
  const FOOD_SHOPS = ['bakery', 'pastry', 'coffee', 'deli'];

  // ─────────────────────────────────────────
  // Búsqueda principal con Photon
  // ─────────────────────────────────────────
  async function searchPlaces(query, city = '') {
    let q = query.trim();
    if (!q) return [];
    if (city) q = `${q}, ${city}`;

    try {
      let results = await searchPhoton(q, [
        'amenity:restaurant', 'amenity:cafe', 'amenity:bar',
        'amenity:pub', 'amenity:fast_food'
      ]);

      if (results.length === 0) {
        results = await searchPhotonLoose(q);
      }

      if (results.length === 0) {
        return await searchNominatim(query, city);
      }

      return results.slice(0, 8);
    } catch (err) {
      console.warn('Photon falló, intentando Nominatim...', err);
      return await searchNominatim(query, city);
    }
  }

  async function searchPhoton(q, osmTags = []) {
    const params = new URLSearchParams({
      q: q,
      limit: '12',
      lang: 'en',
      lat: '40.4168',
      lon: '-3.7038'
    });
    osmTags.forEach(tag => params.append('osm_tag', tag));

    const url = `https://photon.komoot.io/api/?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('Photon HTTP', res.status, errText);
      throw new Error(`Photon error ${res.status}`);
    }

    const data = await res.json();
    return (data.features || [])
      .map(parsePhotonFeature)
      .filter(r => r && r.name);
  }

  async function searchPhotonLoose(q) {
    const params = new URLSearchParams({
      q: q,
      limit: '20',
      lang: 'en',
      lat: '40.4168',
      lon: '-3.7038'
    });

    const url = `https://photon.komoot.io/api/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    return (data.features || [])
      .map(parsePhotonFeature)
      .filter(r => {
        if (!r || !r.name) return false;
        const key = (r.osmKey || '').toLowerCase();
        const val = (r.type || '').toLowerCase();
        const name = r.name.toLowerCase();

        if (key === 'amenity' && FOOD_AMENITIES.includes(val)) return true;
        if (key === 'shop' && FOOD_SHOPS.includes(val)) return true;

        const hints = [
          'restaurante', 'restaurant', 'bar ', 'café', 'cafe', 'pub',
          'bistro', 'pizzeria', 'pizzería', 'tapas', 'asador', 'taberna',
          'mesón', 'meson', 'cafetería', 'cafeteria', 'sushi', 'ramen'
        ];
        return hints.some(h => name.includes(h));
      });
  }

  function parsePhotonFeature(f) {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [];
    const osmTypeRaw = p.osm_type || 'N';
    const typeMap = { N: 'node', W: 'way', R: 'relation' };

    return {
      osmId:    p.osm_id,
      osmType:  typeMap[osmTypeRaw] || 'node',
      osmKey:   p.osm_key || '',
      name:     p.name || '',
      address:  buildPhotonAddress(p),
      lat:      coords[1],
      lng:      coords[0],
      type:     p.osm_value || '',
      extratags: {}
    };
  }

  // ─────────────────────────────────────────
  // Respaldo: Nominatim search
  // ─────────────────────────────────────────
  async function searchNominatim(query, city = '') {
    let q = query.trim();
    if (city) q = `${q}, ${city}`;
    else q = `${q}, España`;

    const params = new URLSearchParams({
      format: 'json',
      q: q,
      limit: '10',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      countrycodes: 'es',
      'accept-language': 'es'
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' }
    });

    if (!res.ok) {
      console.error('Nominatim error:', res.status);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    const validTypes = [...FOOD_AMENITIES, ...FOOD_SHOPS, 'hotel', 'hostel'];

    return data
      .filter(r => {
        if (['amenity', 'shop'].includes(r.class) && validTypes.includes(r.type)) return true;
        const name = (r.namedetails?.name || r.display_name || '').toLowerCase();
        return ['restaurante', 'bar ', 'café', 'cafe', 'pub', 'bistro', 'pizzeria', 'tapas']
          .some(h => name.includes(h));
      })
      .map(r => ({
        osmId:    r.osm_id,
        osmType:  r.osm_type,
        name:     r.namedetails?.name || r.display_name.split(',')[0],
        address:  buildNominatimAddress(r.address),
        lat:      parseFloat(r.lat),
        lng:      parseFloat(r.lon),
        type:     r.type,
        extratags: r.extratags || {}
      }))
      .slice(0, 8);
  }

  // ─────────────────────────────────────────
  // Detalles con Nominatim Lookup (sin CORS)
  // ─────────────────────────────────────────
  async function getDetails(osmType, osmId) {
    if (!osmId) return null;

    const prefix = { node: 'N', way: 'W', relation: 'R' }[osmType] || 'N';
    const osmIds = `${prefix}${osmId}`;

    const params = new URLSearchParams({
      format: 'json',
      osm_ids: osmIds,
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      'accept-language': 'es'
    });

    const url = `https://nominatim.openstreetmap.org/lookup?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'es' }
      });
      if (!res.ok) return null;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      const tags = item.extratags || {};
      const namedetails = item.namedetails || {};

      const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
      const website = tags.website || tags['contact:website'] || tags['contact:facebook'] || '';
      const hours = formatHours(tags.opening_hours || '');
      const cuisine = tags.cuisine
        ? tags.cuisine.replace(/_/g, ' ').replace(/;/g, ', ')
        : '';

      return {
        phone,
        website,
        hours,
        cuisine,
        priceRange: derivePriceRange(tags),
        rating: '',
        wheelchair: tags.wheelchair || '',
        outdoor:  tags.outdoor_seating === 'yes',
        delivery: tags.delivery === 'yes',
        takeaway: tags.takeaway === 'yes',
        name: namedetails.name || item.display_name?.split(',')[0] || '',
        address: buildNominatimAddress(item.address),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || tags.amenity || ''
      };
    } catch (e) {
      console.warn('Nominatim lookup error:', e);
      return null;
    }
  }

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  function buildPhotonAddress(p) {
    const parts = [];
    if (p.street) {
      parts.push(p.housenumber ? `${p.street} ${p.housenumber}` : p.street);
    }
    if (p.district || p.neighbourhood) parts.push(p.district || p.neighbourhood);
    if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village);
    if (p.state && !(p.city || p.town)) parts.push(p.state);
    return parts.join(', ');
  }

  function buildNominatimAddress(addr) {
    if (!addr) return '';
    const parts = [];
    if (addr.road) parts.push(`${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}`);
    if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    return parts.join(', ');
  }

  function formatHours(raw) {
    if (!raw) return '';
    return raw
      .replace(/Mo,Tu,We,Th,Fr/g, 'Lun-Vie')
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
