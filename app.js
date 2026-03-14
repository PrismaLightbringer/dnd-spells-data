// ════════════════════════════════════════════════════════
//  FIREBASE CONFIG
// ════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCgeYhYMpihjMfWhBct9ieifSzW63vbUVY",
  authDomain: "dnd-spell-db.firebaseapp.com",
  projectId: "dnd-spell-db",
  storageBucket: "dnd-spell-db.firebasestorage.app",
  messagingSenderId: "712704145359",
  appId: "1:712704145359:web:737d2dbe109b0e065344ba"
};

// ════════════════════════════════════════════════════════
//  SPELL DATA URL
// ════════════════════════════════════════════════════════
const SPELLS_URL = "https://raw.githubusercontent.com/PrismaLightbringer/dnd-spells-data/main/spells.json";

// ── App State ──
let state = {
  screen: 'loading',
  loginMode: 'login',
  loginError: '',
  user: null,
  spells: [],
  bookmarks: new Set(),
  query: '',
  lang: localStorage.getItem('spell-db-lang') || 'en',
  theme: localStorage.getItem('spell-db-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  filterLevel: 'all',
  filterSchool: 'all',
  filterClass: 'all',
  filterCasting: 'all',
  filterRange: 'all',
  filterConcentration: false,
  filterRitual: false,
  filterMaterialCost: 'all',
  filterBookmarks: false,
  expanded: new Set(),
  homeExpanded: null,
  loading: true,
};

let db = null;
let searchTimeout;

// ── Init ──
(async function init() {
  applyTheme();
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }

  const saved = localStorage.getItem('spell-db-user');
  if (saved) {
    try {
      state.user = JSON.parse(saved);
      state.screen = 'loading';
      render();
      await loadSpells();
      await loadBookmarks();
      state.screen = 'home';
    } catch (e) {
      state.screen = 'login';
    }
  } else {
    state.screen = 'login';
  }
  state.loading = false;
  render();
})();

// ── Data ──
async function loadSpells() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cacheBust = '?t=' + Date.now();
      const res = await fetch(SPELLS_URL + cacheBust);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        state.spells = data;
        return;
      }
      throw new Error('Empty or invalid data');
    } catch (e) {
      console.warn('Spell load attempt ' + (attempt + 1) + ' failed:', e.message);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  console.error('Failed to load spells after 3 attempts');
  state.spells = [];
}

async function loadBookmarks() {
  if (!db || !state.user) return;
  try {
    const doc = await db.collection('bookmarks').doc(state.user.name.toLowerCase()).get();
    if (doc.exists && doc.data().spells) {
      state.bookmarks = new Set(doc.data().spells);
    }
  } catch (e) { console.warn('Bookmark load failed:', e.message); }
}

async function saveBookmarks() {
  if (!db || !state.user) return;
  try {
    await db.collection('bookmarks').doc(state.user.name.toLowerCase()).set({
      spells: [...state.bookmarks],
      updatedAt: new Date().toISOString()
    });
  } catch (e) { console.warn('Bookmark save failed:', e.message); }
}

// ── Auth ──
async function simpleHash(str) {
  const encoded = new TextEncoder().encode(str);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleRegister(name, password) {
  if (!name || name.length < 2) return 'Name must be at least 2 characters';
  if (!password || password.length < 3) return 'Password must be at least 3 characters';
  if (!db) return 'Database not available — check Firebase config';
  const key = name.toLowerCase();
  const doc = await db.collection('users').doc(key).get();
  if (doc.exists) return 'That name is already taken';
  const hash = await simpleHash(password);
  await db.collection('users').doc(key).set({ name, passwordHash: hash, createdAt: new Date().toISOString() });
  return null;
}

async function handleLogin(name, password) {
  if (!name || !password) return 'Please enter name and password';
  if (!db) return 'Database not available — check Firebase config';
  const key = name.toLowerCase();
  const doc = await db.collection('users').doc(key).get();
  if (!doc.exists) return 'User not found — register first';
  const hash = await simpleHash(password);
  if (doc.data().passwordHash !== hash) return 'Wrong password';
  return null;
}

// ── Theme ──
function applyTheme() {
  if (state.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function cycleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('spell-db-theme', state.theme);
  applyTheme();
  render();
}

function themeIcon() {
  return state.theme === 'dark' ? '🌙' : '☀️';
}

// ── Helpers ──
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Global keyboard → search bar ──
document.addEventListener('keydown', (e) => {
  // Ignore if typing in an input already, or modifier keys
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1 && e.key !== 'Backspace') return;

  const searchInput = document.getElementById('search-input') || document.getElementById('home-search-input');
  if (searchInput) {
    searchInput.focus();
    // Let the keystroke pass through to the now-focused input
  }
});
function render() {
  const app = document.getElementById('app');
  if (state.screen === 'loading') { app.innerHTML = renderLoading(); return; }
  if (state.screen === 'login') { app.innerHTML = renderLogin(); attachLoginEvents(); return; }
  if (state.screen === 'home') { app.innerHTML = renderHome(); attachHomeEvents(); return; }
  if (state.screen === 'spells') { const filtered = getFilteredSpells(); app.innerHTML = renderSpellsPage(filtered); attachSpellsEvents(filtered); return; }
}

function renderLoading() {
  return '<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">Loading spell compendium...</div></div>';
}


