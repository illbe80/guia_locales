/* ===== SAVEUR — UI Helpers ===== */

const UI = (() => {

  const CAT_LABELS = {
    coffee: '☕ Café', bar: '🍸 Copas', lunch: '🍽 Almuerzo',
    dinner: '🌙 Cena', brunch: '🥐 Brunch'
  };
  const CAT_EMOJI = {
    coffee: '☕', bar: '🍸', lunch: '🍽', dinner: '🌙', brunch: '🥐'
  };
  const CUISINE_LABELS = {
    spanish:'Española', italian:'Italiana', japanese:'Japonesa',
    mediterranean:'Mediterránea', mexican:'Mexicana', american:'Americana',
    asian:'Asiática', other:'Otra'
  };

  function starsHtml(n) {
    if (!n) return '<span style="color:var(--muted)">Sin valorar</span>';
    return '★'.repeat(n) + '<span style="color:var(--border)">★</span>'.repeat(5-n);
  }

  function priceLabel(p) {
    if (!p) return '';
    const n = parseInt(p);
    if (n <= 15) return '€';
    if (n <= 30) return '€€';
    if (n <= 60) return '€€€';
    return '€€€€';
  }

  /* ---- PLACE CARD ---- */
  function renderCard(place, distKm) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.dataset.id = place.id;

    let photoHtml = '';
    if (place.photo) {
      photoHtml = `<img class="card-photo" src="${place.photo}" alt="${place.name}" loading="lazy" />`;
    } else {
      photoHtml = `<div class="card-photo-placeholder">${CAT_EMOJI[place.category] || '🍽'}</div>`;
    }

    const statusTag = place.status === 'visited'
      ? `<span class="tag tag-status-vis">✓ Visitado</span>`
      : `<span class="tag tag-status-wish">♡ Por visitar</span>`;

    const cuisineTag = (place.cuisine && place.category !== 'coffee' && place.category !== 'bar')
      ? `<span class="tag">${CUISINE_LABELS[place.cuisine] || place.cuisine}</span>` : '';

    const catTag = `<span class="tag tag-gold">${CAT_LABELS[place.category] || place.category}</span>`;

    const distHtml = (distKm !== undefined)
      ? `<div class="card-distance">📍 ${Geo.formatDistance(distKm)}</div>` : '';

    const canNavigate = !!(place.lat && place.lng) || !!place.address;
    const directionsBtn = canNavigate
      ? `<button class="card-directions-btn" type="button" title="Cómo llegar">
           <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
           Cómo llegar
         </button>`
      : '';

    card.innerHTML = `
      ${photoHtml}
      <div class="card-body">
        <div class="card-top">
          <div>
            <div class="card-name">${place.name}</div>
            <div class="card-tags">${catTag}${cuisineTag}${statusTag}</div>
          </div>
        </div>
        <div class="card-meta">
          <div class="card-stars">${starsHtml(place.rating)}</div>
          <div class="card-price">${place.price ? `<span>${priceLabel(place.price)}</span> ~${place.price}€/p` : ''}</div>
        </div>
        ${place.address ? `<div class="card-address"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${place.address}</div>` : ''}
        ${distHtml}
        ${directionsBtn ? `<div class="card-actions">${directionsBtn}</div>` : ''}
      </div>`;
    return card;
  }

  /* ---- DETAIL BODY ---- */
  function renderDetail(place) {
    const rows = [];

    if (place.address) rows.push(`
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <div class="detail-row-content">${place.address}</div>
      </div>`);

    if (place.hours) rows.push(`
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <div class="detail-row-content">${place.hours}</div>
      </div>`);

    if (place.phone) rows.push(`
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.27 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
        <div class="detail-row-content"><a href="tel:${place.phone}" style="color:var(--gold)">${place.phone}</a></div>
      </div>`);

    if (place.website) rows.push(`
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
        <div class="detail-row-content"><a href="${place.website}" target="_blank" style="color:var(--gold)">${place.website.replace(/^https?:\/\//, '')}</a></div>
      </div>`);

    const priceRow = place.price ? `
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div class="detail-row-content">~${place.price}€ por persona <span style="color:var(--gold)">(${priceLabel(place.price)})</span></div>
      </div>` : '';

    const ratingRow = place.rating ? `
      <div class="detail-row">
        <div class="detail-row-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        <div class="detail-row-content"><span class="detail-stars">${'★'.repeat(place.rating)}${'☆'.repeat(5-place.rating)}</span></div>
      </div>` : '';

    const reviewRow = place.review ? `
      <div class="field-group">
        <div class="detail-section-title">Mi opinión</div>
        <div style="font-size:14px;color:var(--text);line-height:1.6;margin-top:4px">${place.review}</div>
      </div>` : '';

    const notesRow = place.notes ? `
      <div class="field-group">
        <div class="detail-section-title">Notas privadas 🔒</div>
        <div class="detail-notes">${place.notes}</div>
      </div>` : '';

    const onlineRow = place.onlineInfo ? buildOnlineInfoHtml(place.onlineInfo) : '';

    return `
      <div class="detail-name">${place.name}</div>
      ${rows.join('')}
      ${priceRow}
      ${ratingRow}
      ${reviewRow}
      ${notesRow}
      ${onlineRow}
      <div style="font-size:11px;color:var(--muted);margin-top:4px">
        Añadido el ${new Date(place.added).toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'})}
      </div>`;
  }

  function buildOnlineInfoHtml(info) {
    if (!info) return '';
    let html = `<div class="online-info-panel">
      <div class="online-info-header">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Datos obtenidos online
      </div>`;
    if (info.hours)    html += `<div class="info-row"><span class="info-row-label">Horario</span><span class="info-row-val">${info.hours}</span></div>`;
    if (info.cuisine)  html += `<div class="info-row"><span class="info-row-label">Cocina</span><span class="info-row-val">${info.cuisine}</span></div>`;
    if (info.phone)    html += `<div class="info-row"><span class="info-row-label">Teléfono</span><span class="info-row-val">${info.phone}</span></div>`;
    if (info.website)  html += `<div class="info-row"><span class="info-row-label">Web</span><span class="info-row-val"><a href="${info.website}" target="_blank" style="color:var(--gold)">${info.website.replace(/^https?:\/\//,'')}</a></span></div>`;
    if (info.priceRange) html += `<div class="info-row"><span class="info-row-label">Precio</span><span class="info-row-val">${info.priceRange}</span></div>`;
    const feats = [];
    if (info.outdoor)  feats.push('Terraza');
    if (info.delivery) feats.push('Delivery');
    if (info.takeaway) feats.push('Para llevar');
    if (feats.length)  html += `<div class="info-row"><span class="info-row-label">Extras</span><span class="info-row-val">${feats.join(' · ')}</span></div>`;
    html += '</div>';
    return html;
  }

  /* ---- STATS ---- */
  function renderStats(places) {
    const total = places.length;
    const visited = places.filter(p => p.status === 'visited').length;
    const wishlist = places.filter(p => p.status === 'wishlist').length;
    const rated = places.filter(p => p.rating);
    const avgRating = rated.length ? (rated.reduce((s,p) => s+p.rating, 0)/rated.length).toFixed(1) : '—';
    const priced = places.filter(p => p.price);
    const avgPrice = priced.length ? Math.round(priced.reduce((s,p) => s+parseInt(p.price), 0)/priced.length) : null;

    document.getElementById('statCards').innerHTML = `
      <div class="stat-card"><div class="stat-card-val">${total}</div><div class="stat-card-label">Lugares guardados</div></div>
      <div class="stat-card"><div class="stat-card-val">${visited}</div><div class="stat-card-label">Visitados</div></div>
      <div class="stat-card"><div class="stat-card-val">${wishlist}</div><div class="stat-card-label">Por visitar</div></div>
      <div class="stat-card"><div class="stat-card-val">${avgRating}</div><div class="stat-card-label">Valoración media</div></div>
      ${avgPrice ? `<div class="stat-card" style="grid-column:span 2"><div class="stat-card-val">${avgPrice}€</div><div class="stat-card-label">Precio medio por persona</div></div>` : ''}
    `;

    // Category bar chart
    const cats = { coffee:'☕ Café', bar:'🍸 Copas', lunch:'🍽 Almuerzo', dinner:'🌙 Cena', brunch:'🥐 Brunch' };
    const catCounts = {};
    places.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    const maxCat = Math.max(1, ...Object.values(catCounts));
    document.getElementById('catChart').innerHTML = Object.entries(cats).map(([k,l]) => {
      const n = catCounts[k] || 0;
      return `<div class="bar-row">
        <span class="bar-label">${l}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(n/maxCat*100).toFixed(0)}%"></div></div>
        <span class="bar-val">${n}</span>
      </div>`;
    }).join('');

    // Price range chart
    const buckets = { '€ (≤15€)':0, '€€ (16-30€)':0, '€€€ (31-60€)':0, '€€€€ (>60€)':0 };
    priced.forEach(p => {
      const n = parseInt(p.price);
      if (n<=15) buckets['€ (≤15€)']++;
      else if (n<=30) buckets['€€ (16-30€)']++;
      else if (n<=60) buckets['€€€ (31-60€)']++;
      else buckets['€€€€ (>60€)']++;
    });
    const maxP = Math.max(1, ...Object.values(buckets));
    document.getElementById('priceChart').innerHTML = Object.entries(buckets).map(([k,n]) => `
      <div class="bar-row">
        <span class="bar-label">${k}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(n/maxP*100).toFixed(0)}%"></div></div>
        <span class="bar-val">${n}</span>
      </div>`).join('');
  }

  function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.classList.add('hidden'), 200);
    }, duration);
  }

  return { renderCard, renderDetail, renderStats, showToast, priceLabel, starsHtml };
})();
