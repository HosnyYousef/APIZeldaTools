// === HYRULE ARCHIVE — MAIN JS ===
// API: https://zelda.fanapis.com/api
// Endpoints used: /games (all), /characters (paginated + search)
// Response shape: { success: true, count: N, data: [...] }
// Images: fetched from Wikipedia API thumbnails (no auth required)

const API      = 'https://zelda.fanapis.com/api';
const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const CHARS_PER_PAGE = 12;

// ─── STATE ──────────────────────────────────────────────
let state = {
  games:       [],
  gamesLoaded: false,
  chars:       [],
  charsPage:   0,
  charsTotal:  0,
  charsQuery:  '',
  searchTimer: null,
  allGamesMap: {},  // id → name, for resolving appearance URLs
  imageCache:  {},  // game name → thumbnail URL
};

// Maps game names to their Wikipedia article titles (handles redirects/variants)
const WIKI_TITLES = {
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
  const count = 80;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 0.5;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --dur: ${2 + Math.random() * 4}s;
      --delay: ${Math.random() * 4}s;
      --min-op: ${0.05 + Math.random() * 0.1};
      --max-op: ${0.3 + Math.random() * 0.5};
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

// ─── WIKIPEDIA IMAGE FETCH ──────────────────────────────
// Fetches the thumbnail Wikipedia shows in the infobox for each game.
// Uses the REST summary API — no key needed, returns { thumbnail: { source } }.
async function fetchGameImage(gameName) {
  if (state.imageCache[gameName]) return state.imageCache[gameName];
  const title = WIKI_TITLES[gameName];
  if (!title) return null;
  try {
    const res = await fetch(`${WIKI_API}${title}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const url = data?.thumbnail?.source || null;
    if (url) state.imageCache[gameName] = url;
    return url;
  } catch {
    return null;
  }
}

// Fetch all game images in parallel after initial render, then inject into DOM
async function prefetchGameImages(games) {
  await Promise.all(games.map(async g => {
    const url = await fetchGameImage(g.name);
    if (!url) return;
    const thumb = document.querySelector(`.game-thumb[data-name="${g.name.replace(/"/g, '\\"')}"]`);
    if (thumb) {
      thumb.style.backgroundImage = `url(${url})`;
      thumb.classList.add('loaded');
    }
  }));
}

// ─── GAMES ──────────────────────────────────────────────
async function loadGames() {
  try {
    const json = await apiFetch(`${API}/games?limit=100`);
    state.games = json.data;
    state.gamesLoaded = true;

    // Populate allGamesMap from game IDs in URL form
    state.games.forEach(g => {
      state.allGamesMap[g.id] = g.name;
    });

    gamesCount.textContent = `${json.data.length} games in the series`;
    renderGames(json.data);
    prefetchGameImages(json.data); // inject images progressively after render
  } catch (err) {
    gamesList.innerHTML = `
      <div class="error-state">
        <strong>Could not reach the API</strong>
        <p>Check your connection or try again — zelda.fanapis.com may be temporarily unavailable.</p>
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
  if (!raw) return '—';
  return raw.trim().replace(/^\s+/, '');
}

// ─── CHARACTERS ─────────────────────────────────────────
async function loadChars(page = 0, query = '') {
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
    const params = new URLSearchParams({
      limit: CHARS_PER_PAGE,
      page,
      ...(query ? { name: query } : {})
    });

    const json = await apiFetch(`${API}/characters?${params}`);
    state.chars = json.data;
    state.charsPage = page;
    state.charsTotal = json.count;

    const totalPages = Math.ceil(json.count / CHARS_PER_PAGE);
    charsCount.textContent = `${json.count} character${json.count !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}`;

    renderChars(json.data);
    renderPagination(page, totalPages);
  } catch (err) {
    charsGrid.innerHTML = `
      <div class="error-state" style="grid-column: 1/-1;">
        <strong>Could not reach the API</strong>
        <p>zelda.fanapis.com may be temporarily unavailable.</p>
      </div>`;
    console.error('Characters fetch failed:', err);
  }
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
      <div class="char-race-tag">${race}</div>
      <div class="char-name">${char.name}</div>
      <div class="char-desc">${char.description || 'No description available.'}</div>
      <div class="char-footer">
        <span class="char-appearances">
          ${apps} game appearance${apps !== 1 ? 's' : ''}
        </span>
        <span class="char-cta">View →</span>
      </div>
    `;
    card.addEventListener('click', () => openCharModal(char));
    charsGrid.appendChild(card);
  });
}

function renderPagination(currentPage, totalPages) {
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 0;
  prev.addEventListener('click', () => {
    loadChars(currentPage - 1, state.charsQuery);
    scrollToChars();
  });
  pagination.appendChild(prev);

  // Show a window of page buttons
  const range = buildPageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '…') {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '…';
      ellipsis.style.cssText = 'color: var(--text-muted); padding: 0 0.25rem; font-size: 0.8rem;';
      pagination.appendChild(ellipsis);
      return;
    }
    const btn = document.createElement('button');
    btn.className = `page-btn${p === currentPage ? ' active' : ''}`;
    btn.textContent = p + 1;
    btn.addEventListener('click', () => {
      loadChars(p, state.charsQuery);
      scrollToChars();
    });
    pagination.appendChild(btn);
  });

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = 'Next →';
  next.disabled = currentPage >= totalPages - 1;
  next.addEventListener('click', () => {
    loadChars(currentPage + 1, state.charsQuery);
    scrollToChars();
  });
  pagination.appendChild(next);
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const range = [];
  if (current <= 3) {
    range.push(0, 1, 2, 3, 4, '…', total - 1);
  } else if (current >= total - 4) {
    range.push(0, '…', total - 5, total - 4, total - 3, total - 2, total - 1);
  } else {
    range.push(0, '…', current - 1, current, current + 1, '…', total - 1);
  }
  return range;
}

function scrollToChars() {
  document.getElementById('tab-characters').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── SEARCH ─────────────────────────────────────────────
function initSearch() {
  charSearch.addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      state.charsQuery = charSearch.value.trim();
      loadChars(0, state.charsQuery);
    }, 400); // debounce
  });
}

// ─── GAME MODAL ─────────────────────────────────────────
async function openGameModal(game) {
  // Render immediately with placeholder, then inject image async
  modalBody.innerHTML = `
    <div class="modal-game-banner" id="modal-banner">
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

  // Inject image if available (from cache or fresh fetch)
  const imgUrl = await fetchGameImage(game.name);
  const wrap = document.getElementById('modal-img-wrap');
  if (imgUrl && wrap) {
    wrap.innerHTML = `<img class="modal-game-img" src="${imgUrl}" alt="${game.name}" />`;
  }
}

// ─── CHARACTER MODAL ────────────────────────────────────
function openCharModal(char) {
  const race   = char.race || 'Unknown race';
  const gender = char.gender || null;
  const apps   = char.appearances || [];

  // Build appearance tags — resolve game names if we have them loaded
  const appTags = apps.map(url => {
    const id = url.split('/').pop();
    const name = state.allGamesMap[id];
    return `<span class="modal-game-tag${name ? ' resolved' : ''}">${name || id}</span>`;
  }).join('');

  modalBody.innerHTML = `
    <div class="modal-char-header">
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

  // Resolve game names async if not yet loaded
  if (apps.length && !state.gamesLoaded) {
    resolveAppearances(char, apps);
  }
}

// Fetch any unresolved game names and update the tags
async function resolveAppearances(char, apps) {
  const tags = document.querySelectorAll('.modal-game-tag:not(.resolved)');
  await Promise.all(apps.map(async (url, i) => {
    const id = url.split('/').pop();
    if (state.allGamesMap[id]) return;
    try {
      const json = await apiFetch(`${API}/games/${id}`);
      const name = json.data?.[0]?.name || json.data?.name;
      if (name) {
        state.allGamesMap[id] = name;
        if (tags[i]) {
          tags[i].textContent = name;
          tags[i].classList.add('resolved');
        }
      }
    } catch { /* silently skip */ }
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
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
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

      // Lazy-load characters tab on first visit
      if (target === 'characters' && !state.chars.length) {
        loadChars(0);
      }
    });
  });
}

// ─── INIT ────────────────────────────────────────────────
function init() {
  initStarfield();
  initTabs();
  initModal();
  initSearch();
  loadGames(); // load games tab immediately (it's the default)
}

document.addEventListener('DOMContentLoaded', init);