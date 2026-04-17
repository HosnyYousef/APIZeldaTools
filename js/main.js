// === HYRULE ARCHIVE — MAIN JS ===
// API: https://zelda.fanapis.com/api
// Endpoints: /games (all), /characters (paginated + search)
// Response shape: { success: true, count: N, data: [...] }
// Images: Wikipedia REST API thumbnails — no key required

const API      = 'https://zelda.fanapis.com/api';
const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const CHARS_PER_PAGE = 20;

// ─── STATE ──────────────────────────────────────────────
let state = {
  games:       [],
  gamesLoaded: false,
  allChars:    [],   // full character list fetched once on first tab visit
  allCharsLoaded: false,
  chars:       [],   // current page slice after filtering
  charsPage:   0,
  charsTotal:  0,
  charsQuery:  '',
  searchTimer: null,
  allGamesMap: {},
  imageCache:  {},
};

// ─── WIKIPEDIA TITLE MAPS ────────────────────────────────

const GAME_WIKI = {
  'The Legend of Zelda':                          'The_Legend_of_Zelda_(video_game)',
  'Zelda II: The Adventure of Link':              'Zelda_II:_The_Adventure_of_Link',
  'The Legend of Zelda: A Link to the Past':      'The_Legend_of_Zelda:_A_Link_to_the_Past',
  "The Legend of Zelda: Link's Awakening":        "The_Legend_of_Zelda:_Link%27s_Awakening",
  'The Legend of Zelda: Ocarina of Time':         'The_Legend_of_Zelda:_Ocarina_of_Time',
  "The Legend of Zelda: Majora's Mask":           "The_Legend_of_Zelda:_Majora%27s_Mask",
  'The Legend of Zelda: Oracle of Ages':          'The_Legend_of_Zelda:_Oracle_of_Ages',
  'The Legend of Zelda: Oracle of Seasons':       'The_Legend_of_Zelda:_Oracle_of_Seasons',
  'The Legend of Zelda: Four Swords':             'The_Legend_of_Zelda:_Four_Swords',
  'The Legend of Zelda: The Wind Waker':          'The_Legend_of_Zelda:_The_Wind_Waker',
  'The Legend of Zelda: Four Swords Adventures':  'The_Legend_of_Zelda:_Four_Swords_Adventures',
  'The Legend of Zelda: The Minish Cap':          'The_Legend_of_Zelda:_The_Minish_Cap',
  'The Legend of Zelda: Twilight Princess':       'The_Legend_of_Zelda:_Twilight_Princess',
  'The Legend of Zelda: Phantom Hourglass':       'The_Legend_of_Zelda:_Phantom_Hourglass',
  'The Legend of Zelda: Spirit Tracks':           'The_Legend_of_Zelda:_Spirit_Tracks',
  'The Legend of Zelda: Skyward Sword':           'The_Legend_of_Zelda:_Skyward_Sword',
  'The Legend of Zelda: A Link Between Worlds':   'The_Legend_of_Zelda:_A_Link_Between_Worlds',
  'The Legend of Zelda: Tri Force Heroes':        'The_Legend_of_Zelda:_Tri_Force_Heroes',
  'The Legend of Zelda: Breath of the Wild':      'The_Legend_of_Zelda:_Breath_of_the_Wild',
  'The Legend of Zelda: Tears of the Kingdom':    'The_Legend_of_Zelda:_Tears_of_the_Kingdom',
};

// Major characters with their own Wikipedia articles
const CHAR_WIKI = {
  'Link':              'Link_(The_Legend_of_Zelda)',
  'Princess Zelda':    'Princess_Zelda',
  'Ganon':             'Ganon',
  'Ganondorf':         'Ganon',
  'Impa':              'Impa',
  'Midna':             'Midna',
  'Navi':              'Navi_(The_Legend_of_Zelda)',
  'Tingle':            'Tingle',
  'Skull Kid':         'Skull_Kid',
  'Fi':                'Fi_(The_Legend_of_Zelda)',
  'Urbosa':            'Urbosa',
  'Mipha':             'Mipha',
  'Revali':            'Revali',
  'Daruk':             'Daruk',
  'Sidon':             'Sidon_(The_Legend_of_Zelda)',
  'Purah':             'Purah_(The_Legend_of_Zelda)',
  'Groose':            'Groose',
  'Ghirahim':          'Ghirahim',
  'Zant':              'Zant_(The_Legend_of_Zelda)',
  'Vaati':             'Vaati_(The_Legend_of_Zelda)',
  'Agahnim':           'Agahnim',
  'Great Deku Tree':   'Great_Deku_Tree',
  'Saria':             'Saria_(The_Legend_of_Zelda)',
  'Ruto':              'Ruto_(The_Legend_of_Zelda)',
  'Darunia':           'Darunia',
  'Nabooru':           'Nabooru',
  'Rauru':             'Rauru_(The_Legend_of_Zelda)',
  'Teba':              'Teba_(The_Legend_of_Zelda)',
  'Yunobo':            'Yunobo',
  'Malon':             'Malon',
  'Epona':             'Epona_(The_Legend_of_Zelda)',
};

// ─── DOM ────────────────────────────────────────────────
const gamesList    = document.getElementById('games-list');
const charsGrid    = document.getElementById('chars-grid');
const pagination   = document.getElementById('pagination');
const gamesCount   = document.getElementById('games-count');
const charsCount   = document.getElementById('chars-count');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody    = document.getElementById('modal-body');
const charSearch   = document.getElementById('char-search');

// ─── STARFIELD ──────────────────────────────────────────
function initStarfield() {
  const field = document.getElementById('starfield');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 0.5;
    star.style.cssText = `
      width: ${size}px; height: ${size}px;
      top: ${Math.random() * 100}%; left: ${Math.random() * 100}%;
      --dur: ${2 + Math.random() * 4}s; --delay: ${Math.random() * 4}s;
      --min-op: ${0.05 + Math.random() * 0.1}; --max-op: ${0.3 + Math.random() * 0.5};
    `;
    field.appendChild(star);
  }
}

// ─── FETCH HELPERS ──────────────────────────────────────
async function apiFetch(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('API returned success: false');
  return json;
}

// Fetch a Wikipedia infobox thumbnail for any named entity
async function fetchWikiImage(name, wikiMap) {
  if (name in state.imageCache) return state.imageCache[name];

  const title = wikiMap[name];
  if (!title) { state.imageCache[name] = null; return null; }

  try {
    const res = await fetch(`${WIKI_API}${title}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) { state.imageCache[name] = null; return null; }
    const data = await res.json();
    const url = data?.thumbnail?.source || null;
    state.imageCache[name] = url;
    return url;
  } catch {
    state.imageCache[name] = null;
    return null;
  }
}

// Fire all image fetches in parallel, inject into matching .{thumbClass}[data-name] elements
async function prefetchImages(names, wikiMap, thumbClass) {
  await Promise.all(names.map(async name => {
    const url = await fetchWikiImage(name, wikiMap);
    if (!url) return;
    const el = document.querySelector(`.${thumbClass}[data-name="${name.replace(/"/g, '\\"')}"]`);
    if (el) { el.style.backgroundImage = `url(${url})`; el.classList.add('loaded'); }
  }));
}

// ─── GAMES ──────────────────────────────────────────────
async function loadGames() {
  try {
    const json = await apiFetch(`${API}/games?limit=100`);
    state.games = json.data;
    state.gamesLoaded = true;
    state.games.forEach(g => { state.allGamesMap[g.id] = g.name; });
    gamesCount.textContent = `${json.data.length} games in the series`;
    renderGames(json.data);
    prefetchImages(json.data.map(g => g.name), GAME_WIKI, 'game-thumb');
  } catch (err) {
    gamesList.innerHTML = `
      <div class="error-state">
        <strong>Could not reach the API</strong>
        <p>Check your connection — zelda.fanapis.com may be temporarily unavailable.</p>
      </div>`;
    console.error('Games fetch failed:', err);
  }
}

function renderGames(games) {
  gamesList.innerHTML = '';
  games.forEach((game, i) => {
    const row = document.createElement('div');
    row.className = 'game-row';
    row.style.setProperty('--i', i);
    row.innerHTML = `
      <div class="game-thumb" data-name="${game.name.replace(/"/g, '&quot;')}"></div>
      <div class="game-info">
        <div class="game-title">${game.name}</div>
        <div class="game-desc">${game.description || 'No description available.'}</div>
      </div>
      <div class="game-meta">
        <div class="game-date">${cleanDate(game.released_date)}</div>
        <div class="game-dev">${game.developer || ''}</div>
      </div>
    `;
    row.addEventListener('click', () => openGameModal(game));
    gamesList.appendChild(row);
  });
}

function cleanDate(raw) {
  return raw ? raw.trim() : '—';
}

// ─── CHARACTERS ─────────────────────────────────────────
// Strategy: fetch ALL characters once (paginating through the API),
// store in state.allChars, then filter/paginate entirely client-side.
// This makes search fully case-insensitive with no API dependency.

async function fetchAllChars() {
  const pageSize = 50; // fetch in batches of 50
  let page = 0;
  let collected = [];

  // First fetch to get total count
  const first = await apiFetch(`${API}/characters?limit=${pageSize}&page=0`);
  collected = collected.concat(first.data);
  const total = first.count;
  const totalPages = Math.ceil(total / pageSize);

  // Fetch remaining pages in parallel
  if (totalPages > 1) {
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const results = await Promise.all(
      remaining.map(p => apiFetch(`${API}/characters?limit=${pageSize}&page=${p}`).catch(() => ({ data: [] })))
    );
    results.forEach(r => { collected = collected.concat(r.data); });
  }

  return collected;
}

async function loadChars(page = 0, query = '') {
  // Show loading only on first ever load
  if (!state.allCharsLoaded) {
    charsGrid.innerHTML = `
      <div class="loading-state">
        <div class="triforce-loader">
          <div class="tl-tri tl-top"></div>
          <div class="tl-tri tl-left"></div>
          <div class="tl-tri tl-right"></div>
        </div>
        <p>Consulting the sages...</p>
      </div>
    `;
    pagination.innerHTML = '';

    try {
      state.allChars = await fetchAllChars();
      state.allCharsLoaded = true;
    } catch (err) {
      charsGrid.innerHTML = `
        <div class="error-state" style="grid-column: 1/-1;">
          <strong>Could not reach the API</strong>
          <p>zelda.fanapis.com may be temporarily unavailable.</p>
        </div>`;
      console.error('Characters fetch failed:', err);
      return;
    }
  }

  // Client-side filter — fully case-insensitive, no API needed
  const q = query.trim().toLowerCase();
  const filtered = q
    ? state.allChars.filter(c => c.name.toLowerCase().includes(q))
    : state.allChars;

  state.charsPage  = page;
  state.charsTotal = filtered.length;
  state.charsQuery = query;

  const totalPages = Math.ceil(filtered.length / CHARS_PER_PAGE);
  const pageSlice  = filtered.slice(page * CHARS_PER_PAGE, (page + 1) * CHARS_PER_PAGE);

  charsCount.textContent = `${filtered.length} character${filtered.length !== 1 ? 's' : ''}${q ? ` matching "${query}"` : ''}`;

  renderChars(pageSlice);
  renderPagination(page, totalPages);
  prefetchImages(pageSlice.map(c => c.name), CHAR_WIKI, 'char-thumb');
}

function renderChars(chars) {
  charsGrid.innerHTML = '';

  if (!chars.length) {
    charsGrid.innerHTML = '<p class="no-results">No characters found — the realm is quiet.</p>';
    return;
  }

  chars.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';
    const race = char.race || 'Unknown';
    const apps = char.appearances?.length || 0;

    card.innerHTML = `
      <div class="char-thumb-wrap">
        <div class="char-thumb" data-name="${char.name.replace(/"/g, '&quot;')}"></div>
      </div>
      <div class="char-body">
        <div class="char-race-tag">${race}</div>
        <div class="char-name">${char.name}</div>
        <div class="char-desc">${char.description || 'No description available.'}</div>
        <div class="char-footer">
          <span class="char-appearances">${apps} game appearance${apps !== 1 ? 's' : ''}</span>
          <span class="char-cta">View →</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openCharModal(char));
    charsGrid.appendChild(card);
  });
}

// ─── PAGINATION ──────────────────────────────────────────
function renderPagination(currentPage, totalPages) {
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 0;
  prev.addEventListener('click', () => { loadChars(currentPage - 1, state.charsQuery); scrollToChars(); });
  pagination.appendChild(prev);

  buildPageRange(currentPage, totalPages).forEach(p => {
    if (p === '…') {
      const el = document.createElement('span');
      el.textContent = '…';
      el.style.cssText = 'color: var(--text-muted); padding: 0 0.25rem; font-size: 0.8rem;';
      pagination.appendChild(el);
      return;
    }
    const btn = document.createElement('button');
    btn.className = `page-btn${p === currentPage ? ' active' : ''}`;
    btn.textContent = p + 1;
    btn.addEventListener('click', () => { loadChars(p, state.charsQuery); scrollToChars(); });
    pagination.appendChild(btn);
  });

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage >= totalPages - 1;
  next.addEventListener('click', () => { loadChars(currentPage + 1, state.charsQuery); scrollToChars(); });
  pagination.appendChild(next);
}

function buildPageRange(current, total) {
  if (total <= 7)           return Array.from({ length: total }, (_, i) => i);
  if (current <= 3)         return [0, 1, 2, 3, 4, '…', total - 1];
  if (current >= total - 4) return [0, '…', total - 5, total - 4, total - 3, total - 2, total - 1];
  return [0, '…', current - 1, current, current + 1, '…', total - 1];
}

function scrollToChars() {
  document.getElementById('tab-characters').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── SEARCH ─────────────────────────────────────────────
// Filtering is 100% client-side so case never matters.
// zelda / ZELDA / ZeLdA all hit the same .toLowerCase().includes() check.
function initSearch() {
  charSearch.addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      loadChars(0, charSearch.value);
    }, 200); // snappier since no network call
  });
}

// ─── GAME MODAL ─────────────────────────────────────────
async function openGameModal(game) {
  modalBody.innerHTML = `
    <div class="modal-game-banner">
      <div class="modal-game-img-wrap" id="modal-img-wrap">
        <div class="modal-triforce-small">
          <div class="mts-tri mts-top"></div>
          <div class="mts-tri mts-left"></div>
          <div class="mts-tri mts-right"></div>
        </div>
      </div>
      <div class="modal-game-title">${game.name}</div>
      <div class="modal-game-pub">${game.publisher || 'Nintendo'}</div>
    </div>
    <div class="modal-inner">
      <div class="modal-section-label">About</div>
      <div class="modal-description">${game.description || 'No description available.'}</div>
      <div class="modal-stats">
        <div class="modal-stat">
          <div class="modal-stat-label">Released</div>
          <div class="modal-stat-value">${cleanDate(game.released_date) || '—'}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Developer</div>
          <div class="modal-stat-value">${game.developer || 'Nintendo'}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Publisher</div>
          <div class="modal-stat-value">${game.publisher || 'Nintendo'}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">ID</div>
          <div class="modal-stat-value" style="font-family: var(--font-mono); font-size: 0.72rem;">${game.id}</div>
        </div>
      </div>
    </div>
  `;
  openModal();

  const imgUrl = await fetchWikiImage(game.name, GAME_WIKI);
  const wrap = document.getElementById('modal-img-wrap');
  if (imgUrl && wrap) {
    wrap.innerHTML = `<img class="modal-game-img" src="${imgUrl}" alt="${game.name}" />`;
  }
}

// ─── CHARACTER MODAL ────────────────────────────────────
async function openCharModal(char) {
  const race   = char.race   || 'Unknown race';
  const gender = char.gender || null;
  const apps   = char.appearances || [];

  const appTags = apps.map(url => {
    const id   = url.split('/').pop();
    const name = state.allGamesMap[id];
    return `<span class="modal-game-tag${name ? ' resolved' : ''}">${name || id}</span>`;
  }).join('');

  modalBody.innerHTML = `
    <div class="modal-char-header">
      <div class="modal-char-img-wrap" id="modal-char-img-wrap">
        <div class="modal-triforce-small">
          <div class="mts-tri mts-top"></div>
          <div class="mts-tri mts-left"></div>
          <div class="mts-tri mts-right"></div>
        </div>
      </div>
      <div class="modal-char-race">${race}</div>
      <div class="modal-char-name">${char.name}</div>
      ${gender ? `<div class="modal-char-gender">${gender}</div>` : ''}
    </div>
    <div class="modal-inner">
      <div class="modal-section-label">Description</div>
      <div class="modal-description">${char.description || 'No description available.'}</div>
      ${apps.length ? `
        <div class="modal-section-label">Appears in</div>
        <div class="modal-appearances-list">${appTags}</div>
      ` : ''}
    </div>
  `;

  openModal();

  // Inject character image if we have one
  const imgUrl = await fetchWikiImage(char.name, CHAR_WIKI);
  const wrap = document.getElementById('modal-char-img-wrap');
  if (imgUrl && wrap) {
    wrap.innerHTML = `<img class="modal-char-img" src="${imgUrl}" alt="${char.name}" />`;
  }

  if (apps.length && !state.gamesLoaded) resolveAppearances(apps);
}

async function resolveAppearances(apps) {
  const tags = document.querySelectorAll('.modal-game-tag:not(.resolved)');
  await Promise.all(apps.map(async (url, i) => {
    const id = url.split('/').pop();
    if (state.allGamesMap[id]) return;
    try {
      const json = await apiFetch(`${API}/games/${id}`);
      const name = json.data?.[0]?.name || json.data?.name;
      if (name) {
        state.allGamesMap[id] = name;
        if (tags[i]) { tags[i].textContent = name; tags[i].classList.add('resolved'); }
      }
    } catch { /* skip */ }
  }));
}

// ─── MODAL UTILS ────────────────────────────────────────
function openModal() {
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ─── TABS ────────────────────────────────────────────────
function initTabs() {
  const tabs   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');
      if (target === 'characters' && !state.chars.length) loadChars(0);
    });
  });
}

// ─── INIT ────────────────────────────────────────────────
function init() {
  initStarfield();
  initTabs();
  initModal();
  initSearch();
  loadGames();
}

document.addEventListener('DOMContentLoaded', init);