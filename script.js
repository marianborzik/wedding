// ─────────────────────────────────────────────────────────────
// Konfigurácia
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  // Východiskový jazyk
  defaultLang: 'sk',
};

// ─────────────────────────────────────────────────────────────
// Miesta na mape — uprav súradnice ak treba (lat, lng)
// ─────────────────────────────────────────────────────────────
const VENUES = [
  {
    id: 'church',
    coords: [48.72027, 21.25822],
    title:    { sk: 'Dóm svätej Alžbety',   en: 'St. Elizabeth Cathedral', hu: 'Szent Erzsébet-dóm' },
    subtitle: { sk: 'Obrad · 15:30',         en: 'Ceremony · 15:30',        hu: 'Szertartás · 15:30' },
    addr:     { sk: 'Hlavná, 040 01 Košice', en: 'Hlavná, 040 01 Košice',   hu: 'Hlavná, 040 01 Kassa' },
  },
  {
    id: 'reception',
    coords: [48.725686, 21.251717],
    title:    { sk: 'Sála Bačíkova',                              en: 'Sála Bačíkova',                              hu: 'Bačíkova terem' },
    subtitle: { sk: 'Hostina · 17:00',                             en: 'Reception · 17:00',                          hu: 'Fogadás · 17:00' },
    addr:     { sk: 'Bačíkova 3023, 040 01 Košice — Staré Mesto',  en: 'Bačíkova 3023, 040 01 Košice — Staré Mesto', hu: 'Bačíkova 3023, 040 01 Kassa — Óváros' },
  },
  {
    id: 'hotel',
    coords: [48.72717, 21.25123],
    title:    { sk: 'Boutique Hotel Maratón',                            en: 'Boutique Hotel Maratón',                            hu: 'Boutique Hotel Maratón' },
    subtitle: { sk: 'Ubytovanie',                                         en: 'Accommodation',                                     hu: 'Szállás' },
    addr:     { sk: 'Strojárenská 2966/11A, 040 01 Košice — Staré Mesto', en: 'Strojárenská 2966/11A, 040 01 Košice — Staré Mesto', hu: 'Strojárenská 2966/11A, 040 01 Kassa — Óváros' },
  },
];

// ─────────────────────────────────────────────────────────────
// Prepínanie jazyka
// ─────────────────────────────────────────────────────────────
let currentLang = CONFIG.defaultLang;

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-sk], [data-en]').forEach(el => {
    const value = el.dataset[lang];
    if (value !== undefined) el.textContent = value;
  });

  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Update map tooltips/popups if map is initialized
  updateMapTooltips();
}

function initLangToggle() {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });
}

// ─────────────────────────────────────────────────────────────
// Mapa (Leaflet) — markery s permanentnými popiskami a popupom
// ─────────────────────────────────────────────────────────────
let mapMarkers = [];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function initMap() {
  const el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return;

  // Pick which venues to render via data-venues="church,reception" attribute
  const ids = (el.dataset.venues || '').split(',').map(s => s.trim()).filter(Boolean);
  const venues = ids.length ? VENUES.filter(v => ids.includes(v.id)) : VENUES;
  if (!venues.length) return;

  const map = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  mapMarkers = venues.map(v => {
    const marker = L.marker(v.coords).addTo(map);
    marker._venue = v;
    return marker;
  });

  updateMapTooltips();

  const bounds = L.latLngBounds(venues.map(v => v.coords));
  map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
}

function updateMapTooltips() {
  if (!mapMarkers.length) return;

  mapMarkers.forEach(marker => {
    const v = marker._venue;
    const title = v.title[currentLang]    || v.title.sk;
    const sub   = v.subtitle[currentLang] || v.subtitle.sk;
    const addr  = v.addr[currentLang]     || v.addr.sk;

    marker.unbindTooltip();
    marker.bindTooltip(title, {
      permanent: true,
      direction: 'top',
      offset: [-14, -12],
      className: 'venue-tooltip',
    });

    marker.unbindPopup();
    marker.bindPopup(
      `<span class="popup-title">${escapeHtml(title)}</span>` +
      `<span class="popup-sub">${escapeHtml(sub)}</span>` +
      `<span class="popup-addr">${escapeHtml(addr)}</span>`
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLangToggle();
  applyLanguage(CONFIG.defaultLang);
  initMap();
  // Once markers exist, sync tooltip language with current selection
  updateMapTooltips();
});
