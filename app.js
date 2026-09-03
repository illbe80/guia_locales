/* ===== SAVEUR — Main App Logic ===== */

let places = [];
let activeCat = 'all';
let activeCuisine = 'all';
let activeStatus = 'all';
let activeSort = 'added';
let sortByDistance = false;
let userCoords = null;
let editingId = null;
let currentRating = 0;
let pendingPhotoDataURL = null;
let pendingOnlineInfo = null;
let mapInstance = null;
let mapMarkers = [];

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  await loadPlaces();
  renderList();
  bindEvents();
  setTimeout(() => {
    document.getElementById('splash').classList.add('out');
    setTimeout(() => {
      document.getElementById('splash').remove();
      document.getElementById('app').classList.remove('hidden');
    }, 500);
  }, 1000);
});

async function loadPlaces() {
  places = await DB.getAll();
}

// ═══════════════════════════════════════════
// RENDER LIST
// ═══════════════════════════════════════════
function renderList() {
  const list = document.getElementById('placeList');
  let filtered = places.filter(p => {
    if (activeCat !== 'all' && p.category !== activeCat) return false;
    if (activeCuisine !== 'all' && p.cuisine !== activeCuisine) return false;
    if (activeStatus !== 'all' && p.status !== activeStatus) return false;
    const q = document.getElementById('searchInput').value.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.address||'').toLowerCase().includes(q)) return false;
    return true;
  });

  // Sort
  filtered = sortPlaces(filtered);

  // Clear
  list.innerHTML = '';

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🍽</div>
      <p class="empty-title">${places.length ? 'Sin resultados' : 'Sin lugares todavía'}</p>
      <p class="empty-sub">${places.length ? 'Prueba con otros filtros' : 'Añade tu primer restaurante o bar con el botón +'}</p>
    </div>`;
    return;
  }

  filtered.forEach(p => {
    let distKm;
    if (sortByDistance && userCoords && p.lat && p.lng) {
      distKm = Geo.distance(userCoords.lat, userCoords.lng, p.lat, p.lng);
    }
    const card = UI.renderCard(p, distKm);
    card.addEventListener('click', () => openDetail(p.id));
    list.appendChild(card);
  });
}

function sortPlaces(arr) {
  return [...arr].sort((a, b) => {
    if (activeSort === 'price') return (parseInt(a.price)||9999) - (parseInt(b.price)||9999);
    if (activeSort === 'rating') return (b.rating||0) - (a.rating||0);
    if (activeSort === 'distance' && userCoords) {
      const da = (a.lat && a.lng) ? Geo.distance(userCoords.lat, userCoords.lng, a.lat, a.lng) : 99999;
      const db2 = (b.lat && b.lng) ? Geo.distance(userCoords.lat, userCoords.lng, b.lat, b.lng) : 99999;
      return da - db2;
    }
    return new Date(b.added) - new Date(a.added);
  });
}

// ═══════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════
async function openDetail(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;

  const hero = document.getElementById('detailHero');
  if (p.photo) {
    hero.innerHTML = `<img src="${p.photo}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <button class="icon-btn detail-close" id="detailClose" style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(13,15,20,0.7);backdrop-filter:blur(6px);color:var(--text-hi)">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="detail-badge" id="detailBadge">${catLabel(p.category)}</div>`;
  } else {
    const em = { coffee:'☕', bar:'🍸', lunch:'🍽', dinner:'🌙', brunch:'🥐' };
    hero.innerHTML = `<div class="detail-hero-placeholder">${em[p.category]||'🍽'}</div>
      <button class="icon-btn detail-close" id="detailClose" style="position:absolute;top:12px;right:12px;z-index:2;background:rgba(13,15,20,0.7);backdrop-filter:blur(6px);color:var(--text-hi)">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="detail-badge" id="detailBadge">${catLabel(p.category)}</div>`;
  }

  document.getElementById('detailBody').innerHTML = UI.renderDetail(p);
  document.getElementById('detailEditBtn').onclick = () => { closeDetail(); openModal(p.id); };
  document.getElementById('detailDirectionsBtn').onclick = () => openDirections(p);

  document.getElementById('detailOverlay').classList.remove('hidden');
  document.getElementById('detailOverlay').querySelector('#detailClose').onclick = closeDetail;
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.add('hidden');
}

function openDirections(p) {
  if (p.lat && p.lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank');
  } else if (p.address) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address)}`, '_blank');
  }
}

function catLabel(cat) {
  return { coffee:'☕ Café', bar:'🍸 Copas', lunch:'🍽 Almuerzo', dinner:'🌙 Cena', brunch:'🥐 Brunch' }[cat] || cat;
}

// ═══════════════════════════════════════════
// ADD / EDIT MODAL
// ═══════════════════════════════════════════
function openModal(id = null) {
  editingId = id;
  currentRating = 0;
  pendingPhotoDataURL = null;
  pendingOnlineInfo = null;

  document.getElementById('modalTitle').textContent = id ? 'Editar lugar' : 'Nuevo lugar';
  document.getElementById('deleteBtn').classList.toggle('hidden', !id);
  resetForm();

  if (id) {
    const p = places.find(x => x.id === id);
    if (p) fillForm(p);
  }

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('onlineResults').classList.add('hidden');
  document.getElementById('onlineInfoPanel').classList.add('hidden');
}

function resetForm() {
  ['fName','fAddress','fPrice','fHours','fPhone','fWebsite','fNotes','fReview','onlineSearch'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fCategory').value = 'dinner';
  document.getElementById('fCuisine').value = 'spanish';
  document.getElementById('fStatus').value = 'wishlist';
  setRating(0);
  document.getElementById('photoPreview').innerHTML = `
    <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <span>Toca para añadir foto</span>`;
  document.getElementById('geocodeStatus').textContent = '';
  toggleCuisineField();
}

function fillForm(p) {
  document.getElementById('fName').value = p.name || '';
  document.getElementById('fAddress').value = p.address || '';
  document.getElementById('fPrice').value = p.price || '';
  document.getElementById('fHours').value = p.hours || '';
  document.getElementById('fPhone').value = p.phone || '';
  document.getElementById('fWebsite').value = p.website || '';
  document.getElementById('fNotes').value = p.notes || '';
  document.getElementById('fReview').value = p.review || '';
  document.getElementById('fCategory').value = p.category || 'dinner';
  document.getElementById('fCuisine').value = p.cuisine || 'other';
  document.getElementById('fStatus').value = p.status || 'wishlist';
  setRating(p.rating || 0);
  if (p.photo) {
    pendingPhotoDataURL = p.photo;
    document.getElementById('photoPreview').innerHTML = `<img src="${p.photo}" />`;
  }
  if (p.onlineInfo) {
    pendingOnlineInfo = p.onlineInfo;
    showOnlineInfoPanel(p.onlineInfo);
  }
  toggleCuisineField();
}

async function savePlace() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { UI.showToast('El nombre es obligatorio'); return; }

  const address = document.getElementById('fAddress').value.trim();
  let lat = null, lng = null;

  if (address) {
    try {
      const coords = await Geo.geocodeAddress(address);
      lat = coords.lat; lng = coords.lng;
    } catch(e) { /* coords not found, ok */ }
  }

  const place = {
    id:      editingId || crypto.randomUUID(),
    name,
    category: document.getElementById('fCategory').value,
    cuisine:  document.getElementById('fCuisine').value,
    status:   document.getElementById('fStatus').value,
    address,
    lat, lng,
    price:    document.getElementById('fPrice').value,
    rating:   currentRating || null,
    hours:    document.getElementById('fHours').value.trim(),
    phone:    document.getElementById('fPhone').value.trim(),
    website:  document.getElementById('fWebsite').value.trim(),
    notes:    document.getElementById('fNotes').value.trim(),
    review:   document.getElementById('fReview').value.trim(),
    photo:    pendingPhotoDataURL,
    onlineInfo: pendingOnlineInfo,
    added:    editingId ? (places.find(p=>p.id===editingId)?.added || new Date().toISOString()) : new Date().toISOString(),
    updated:  new Date().toISOString()
  };

  await DB.put(place);
  if (editingId) {
    places = places.map(p => p.id === editingId ? place : p);
  } else {
    places.push(place);
  }

  closeModal();
  renderList();
  UI.showToast(editingId ? '✓ Lugar actualizado' : '✓ Lugar guardado');
}

async function deletePlace() {
  if (!editingId) return;
  if (!confirm('¿Eliminar este lugar?')) return;
  await DB.remove(editingId);
  places = places.filter(p => p.id !== editingId);
  closeModal();
  renderList();
  UI.showToast('Lugar eliminado');
}

// ═══════════════════════════════════════════
// STAR RATING
// ═══════════════════════════════════════════
function setRating(n) {
  currentRating = n;
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= n);
  });
}

// ═══════════════════════════════════════════
// PHOTO
// ═══════════════════════════════════════════
document.getElementById('fPhoto').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhotoDataURL = ev.target.result;
    document.getElementById('photoPreview').innerHTML = `<img src="${ev.target.result}" />`;
  };
  reader.readAsDataURL(file);
});

// ═══════════════════════════════════════════
// ONLINE SEARCH
// ═══════════════════════════════════════════
document.getElementById('fetchInfoBtn').addEventListener('click', async () => {
  const q = document.getElementById('onlineSearch').value.trim();
  if (!q) return;

  const btn = document.getElementById('fetchInfoBtn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    const results = await API.searchPlaces(q);
    renderOnlineResults(results);
  } catch(e) {
    UI.showToast('Error buscando online');
  } finally {
    btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Buscar';
    btn.disabled = false;
  }
});

function renderOnlineResults(results) {
  const container = document.getElementById('onlineResults');
  if (!results.length) {
    container.innerHTML = '<div class="online-result-item"><div class="online-result-name">Sin resultados</div></div>';
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = results.map((r,i) => `
    <div class="online-result-item" data-idx="${i}">
      <div class="online-result-name">${r.name}</div>
      <div class="online-result-sub">${r.address || ''}</div>
    </div>`).join('');
  container.classList.remove('hidden');

  container.querySelectorAll('.online-result-item').forEach((el, i) => {
    el.addEventListener('click', async () => {
      const r = results[i];
      document.getElementById('fName').value = r.name;
      document.getElementById('fAddress').value = r.address || '';
      container.classList.add('hidden');

      // Auto-map category from OSM type
      const catMap = { restaurant:'dinner', cafe:'coffee', bar:'bar', pub:'bar', fast_food:'lunch' };
      if (catMap[r.type]) document.getElementById('fCategory').value = catMap[r.type];
      toggleCuisineField();

      // Fetch details
      try {
        const info = await API.getDetails(r.osmType, r.osmId);
        if (info) {
          pendingOnlineInfo = info;
          if (info.hours && !document.getElementById('fHours').value) document.getElementById('fHours').value = info.hours;
          if (info.phone && !document.getElementById('fPhone').value) document.getElementById('fPhone').value = info.phone;
          if (info.website && !document.getElementById('fWebsite').value) document.getElementById('fWebsite').value = info.website;
          if (info.cuisine) {
            const cuisineMap = {
              spanish:'spanish', italian:'italian', japanese:'japanese',
              mediterranean:'mediterranean', mexican:'mexican', american:'american', asian:'asian'
            };
            for (const [k,v] of Object.entries(cuisineMap)) {
              if (info.cuisine.toLowerCase().includes(k)) { document.getElementById('fCuisine').value = v; break; }
            }
          }
          showOnlineInfoPanel(info);
        }
      } catch(e) { /* details not critical */ }
    });
  });
}

function showOnlineInfoPanel(info) {
  const panel = document.getElementById('onlineInfoPanel');
  const content = document.getElementById('onlineInfoContent');
  let html = '';
  if (info.hours)      html += `<div class="info-row"><span class="info-row-label">Horario</span><span class="info-row-val">${info.hours}</span></div>`;
  if (info.cuisine)    html += `<div class="info-row"><span class="info-row-label">Cocina</span><span class="info-row-val">${info.cuisine}</span></div>`;
  if (info.priceRange) html += `<div class="info-row"><span class="info-row-label">Precio</span><span class="info-row-val">${info.priceRange}</span></div>`;
  if (info.outdoor || info.delivery || info.takeaway) {
    const feats = [];
    if (info.outdoor)  feats.push('Terraza');
    if (info.delivery) feats.push('Delivery');
    if (info.takeaway) feats.push('Para llevar');
    html += `<div class="info-row"><span class="info-row-label">Extras</span><span class="info-row-val">${feats.join(' · ')}</span></div>`;
  }
  content.innerHTML = html || '<span style="color:var(--muted);font-size:13px">No hay datos adicionales disponibles</span>';
  panel.classList.remove('hidden');
}

// ═══════════════════════════════════════════
// GPS ADDRESS BUTTON
// ═══════════════════════════════════════════
document.getElementById('gpsAddrBtn').addEventListener('click', async () => {
  const status = document.getElementById('geocodeStatus');
  status.textContent = 'Obteniendo ubicación...';
  try {
    const coords = await Geo.getUserLocation();
    const addr = await Geo.reverseGeocode(coords.lat, coords.lng);
    document.getElementById('fAddress').value = addr.split(',').slice(0,3).join(',');
    status.textContent = '✓ Ubicación obtenida';
    status.style.color = 'var(--success)';
  } catch(e) {
    status.textContent = 'No se pudo obtener la ubicación';
    status.style.color = 'var(--danger)';
  }
});

// ═══════════════════════════════════════════
// CATEGORY FIELD TOGGLE
// ═══════════════════════════════════════════
function toggleCuisineField() {
  const cat = document.getElementById('fCategory').value;
  const show = cat === 'lunch' || cat === 'dinner' || cat === 'brunch';
  document.getElementById('cuisineField').style.display = show ? '' : 'none';
}
document.getElementById('fCategory').addEventListener('change', toggleCuisineField);

// ═══════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════
function initMap() {
  if (mapInstance) {
    updateMapMarkers();
    return;
  }
  mapInstance = L.map('leafletMap').setView([40.416, -3.703], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapInstance);
  updateMapMarkers();
}

function updateMapMarkers() {
  mapMarkers.forEach(m => m.remove());
  mapMarkers = [];
  const goldIcon = L.divIcon({
    html: `<div style="background:var(--gold,#C9A96E);width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize:[16,16], iconAnchor:[8,8]
  });
  places.forEach(p => {
    if (!p.lat || !p.lng) return;
    const m = L.marker([p.lat, p.lng], { icon: goldIcon })
      .bindPopup(`<b>${p.name}</b><br>${p.address||''}`)
      .addTo(mapInstance);
    m.on('click', () => openDetail(p.id));
    mapMarkers.push(m);
  });
  if (mapMarkers.length && !editingId) {
    const bounds = L.latLngBounds(mapMarkers.map(m => m.getLatLng()));
    mapInstance.fitBounds(bounds, { padding: [30,30] });
  }
}

// ═══════════════════════════════════════════
// GPS TOGGLE (sort by distance)
// ═══════════════════════════════════════════
document.getElementById('gpsCheck').addEventListener('change', async e => {
  if (e.target.checked) {
    try {
      userCoords = await Geo.getUserLocation();
      sortByDistance = true;
      activeSort = 'distance';
      document.querySelectorAll('.sort-opt[data-sort]').forEach(b => b.classList.toggle('active', b.dataset.sort === 'distance'));
      renderList();
      UI.showToast('📍 Ordenando por distancia');
    } catch(err) {
      e.target.checked = false;
      UI.showToast('No se pudo obtener tu ubicación');
    }
  } else {
    sortByDistance = false;
    renderList();
  }
});

// ═══════════════════════════════════════════
// BIND EVENTS
// ═══════════════════════════════════════════
function bindEvents() {
  // FAB
  document.getElementById('fabAdd').addEventListener('click', () => openModal());

  // Modal buttons
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('saveBtn').addEventListener('click', savePlace);
  document.getElementById('deleteBtn').addEventListener('click', deletePlace);
  document.getElementById('detailClose').addEventListener('click', closeDetail);

  // Star rating
  document.querySelectorAll('.star').forEach(s => {
    s.addEventListener('click', () => setRating(parseInt(s.dataset.val)));
    s.addEventListener('mouseenter', () => {
      document.querySelectorAll('.star').forEach(x => x.classList.toggle('active', parseInt(x.dataset.val) <= parseInt(s.dataset.val)));
    });
    s.addEventListener('mouseleave', () => setRating(currentRating));
  });

  // Category chips
  document.getElementById('categoryChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeCat = chip.dataset.cat;
    document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.toggle('active', c === chip));
    const foodCats = ['lunch','dinner','brunch'];
    document.getElementById('cuisineStrip').classList.toggle('hidden', !foodCats.includes(activeCat));
    activeCuisine = 'all';
    document.querySelectorAll('#cuisineChips .chip-sm').forEach(c => c.classList.toggle('active', c.dataset.cuisine === 'all'));
    renderList();
  });

  // Cuisine chips
  document.getElementById('cuisineChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip-sm');
    if (!chip) return;
    activeCuisine = chip.dataset.cuisine;
    document.querySelectorAll('#cuisineChips .chip-sm').forEach(c => c.classList.toggle('active', c === chip));
    renderList();
  });

  // Sort options
  document.getElementById('sortPanel').addEventListener('click', e => {
    const opt = e.target.closest('.sort-opt');
    if (!opt) return;
    if (opt.dataset.sort) {
      activeSort = opt.dataset.sort;
      document.querySelectorAll('.sort-opt[data-sort]').forEach(b => b.classList.toggle('active', b === opt));
      if (activeSort === 'distance' && !userCoords) {
        Geo.getUserLocation().then(c => { userCoords = c; renderList(); }).catch(() => UI.showToast('Sin acceso al GPS'));
      }
    }
    if (opt.dataset.status) {
      activeStatus = opt.dataset.status;
      document.querySelectorAll('.sort-opt[data-status]').forEach(b => b.classList.toggle('active', b === opt));
    }
    renderList();
  });

  // Sort toggle button
  document.getElementById('sortBtn').addEventListener('click', () => {
    document.getElementById('sortPanel').classList.toggle('open');
  });

  // Search
  document.getElementById('searchToggle').addEventListener('click', () => {
    document.getElementById('searchBar').classList.remove('hidden');
    document.getElementById('searchInput').focus();
  });
  document.getElementById('searchClose').addEventListener('click', () => {
    document.getElementById('searchBar').classList.add('hidden');
    document.getElementById('searchInput').value = '';
    renderList();
  });
  document.getElementById('searchInput').addEventListener('input', renderList);

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.dataset.view;
      document.getElementById('mapView').classList.toggle('hidden', view !== 'map');
      document.getElementById('statsView').classList.toggle('hidden', view !== 'stats');
      document.getElementById('placeList').style.display = view === 'list' ? '' : 'none';
      document.getElementById('fabAdd').style.display = view === 'list' ? '' : 'none';

      if (view === 'map') setTimeout(() => { initMap(); mapInstance.invalidateSize(); }, 50);
      if (view === 'stats') UI.renderStats(places);
    });
  });

  // Close modals on overlay click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.getElementById('detailOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detailOverlay')) closeDetail();
  });
}
