// ── Changelog Data ──
const CHANGELOG = [
  {
    date: '2026-03-15',
    title_en: 'Home Page + Code Split',
    title_de: 'Startseite + Code-Aufteilung',
    items_en: [
      'New home dashboard with search, prepared spells, and feature cards',
      'Quick-tap spell chips for bookmarked spells',
      'Feature overview: Spell Database (live), Character Sheets, Rules, Homebrew, Character Builder (coming soon)',
      'Codebase split into multiple files for better maintainability',
    ],
    items_de: [
      'Neue Startseite mit Suche, vorbereiteten Zaubern und Funktionskarten',
      'Schnellzugriff auf gespeicherte Zauber',
      'Funktionsübersicht: Zauberdatenbank (live), Charakterbögen, Regeln, Eigenkreationen, Charakterbaukasten (bald)',
      'Codebase in mehrere Dateien aufgeteilt für bessere Wartbarkeit',
    ]
  },
  {
    date: '2026-03-14',
    title_en: 'Launch + Filters & UX',
    title_de: 'Start + Filter & UX',
    items_en: [
      'Initial launch with 391 bilingual spells (EN/DE)',
      'Search across both languages simultaneously',
      'Filters: Level, School, Class, Casting Time, Range, Concentration, Ritual, Material Cost',
      'Bookmark/favorites with cloud sync across devices',
      'Multi-expand in bookmark view + Expand/Collapse all',
      'Dark / light / auto theme',
      'Mobile-friendly design',
      'Login with name + password, or browse as guest',
    ],
    items_de: [
      'Start mit 391 zweisprachigen Zaubern (EN/DE)',
      'Suche in beiden Sprachen gleichzeitig',
      'Filter: Grad, Schule, Klasse, Zeitaufwand, Reichweite, Konzentration, Ritual, Materialkosten',
      'Lesezeichen/Favoriten mit Cloud-Sync über Geräte hinweg',
      'Mehrfach aufklappen in Lesezeichen-Ansicht + Alle auf-/zuklappen',
      'Dunkles / helles / automatisches Design',
      'Mobilfreundliches Design',
      'Anmeldung mit Name + Passwort, oder als Gast durchsuchen',
    ]
  }
];

// ── Render Login ──
function renderLogin() {
  const isReg = state.loginMode === 'register';
  const l = state.lang;

  // Build changelog HTML
  let changelogHtml = '<div class="changelog"><div class="changelog-title">' + (l === 'en' ? "What's New" : 'Neuigkeiten') + '</div>';

  CHANGELOG.forEach((entry, i) => {
    const items = l === 'en' ? entry.items_en : entry.items_de;
    const title = l === 'en' ? entry.title_en : entry.title_de;
    if (i === 0) {
      changelogHtml += '<div class="changelog-entry latest"><span class="date">' + entry.date + ' — ' + escHtml(title) + '</span><ul>';
      items.forEach(item => { changelogHtml += '<li>' + escHtml(item) + '</li>'; });
      changelogHtml += '</ul></div>';
    } else {
      changelogHtml += '<div class="changelog-collapsed" data-changelog="' + i + '"><span class="arrow">▼</span><span class="date">' + entry.date + '</span><span class="summary">' + escHtml(title) + '</span></div>';
    }
  });

  changelogHtml += '</div>';

  return '<div class="login-screen"><div class="login-box">' +
    '<h1>' + (l === 'en' ? 'Spell Compendium' : 'Zauberkompendium') + '</h1>' +
    '<div class="subtitle">D&D 5e 2024 — English / Deutsch</div>' +
    '<input id="login-name" type="text" placeholder="' + (l === 'en' ? 'Your name' : 'Dein Name') + '" autocomplete="username" />' +
    '<input id="login-pw" type="password" placeholder="' + (l === 'en' ? 'Password' : 'Passwort') + '" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" />' +
    '<button id="login-btn">' + (isReg ? (l === 'en' ? 'Create Account' : 'Konto erstellen') : (l === 'en' ? 'Log In' : 'Anmelden')) + '</button>' +
    (state.loginError ? '<div class="login-error">' + escHtml(state.loginError) + '</div>' : '') +
    '<div class="login-toggle">' +
    (isReg
      ? (l === 'en' ? 'Already have an account? <a id="toggle-mode">Log in</a>' : 'Bereits ein Konto? <a id="toggle-mode">Anmelden</a>')
      : (l === 'en' ? 'New here? <a id="toggle-mode">Create account</a>' : 'Neu hier? <a id="toggle-mode">Konto erstellen</a>')) +
    '</div>' +
    '<div class="login-skip"><a id="skip-login">' + (l === 'en' ? 'Browse without account' : 'Ohne Konto durchsuchen') + '</a></div>' +
    '<div style="margin-top:16px"><button class="header-btn" id="login-lang-btn" style="font-size:13px;padding:6px 16px">' + (l === 'en' ? 'EN 🇬🇧' : 'DE 🇩🇪') + '</button></div>' +
    '<div style="margin-top:14px;font-size:11px;color:var(--text-muted);font-family:var(--font-ui)">' + (l === 'en' ? 'Forgot your password? Contact the admin for a reset.' : 'Passwort vergessen? Wende dich an den Admin.') + '</div>' +
    changelogHtml +
    '</div></div>';
}

// ── Login Events ──
function attachLoginEvents() {
  const btn = document.getElementById('login-btn');
  const toggle = document.getElementById('toggle-mode');
  const skip = document.getElementById('skip-login');
  const nameInput = document.getElementById('login-name');
  const pwInput = document.getElementById('login-pw');

  btn?.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const pw = pwInput.value;
    btn.disabled = true;
    btn.textContent = '...';
    let error;
    if (state.loginMode === 'register') {
      error = await handleRegister(name, pw);
    } else {
      error = await handleLogin(name, pw);
    }
    if (error) {
      state.loginError = error;
      btn.disabled = false;
      render();
      return;
    }
    state.user = { name };
    localStorage.setItem('spell-db-user', JSON.stringify(state.user));
    state.loginError = '';
    state.screen = 'loading';
    render();
    await loadSpells();
    await loadBookmarks();
    state.screen = 'home';
    render();
  });

  pwInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn?.click(); });
  nameInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') pwInput?.focus(); });

  toggle?.addEventListener('click', () => {
    state.loginMode = state.loginMode === 'login' ? 'register' : 'login';
    state.loginError = '';
    render();
  });

  skip?.addEventListener('click', async () => {
    state.screen = 'loading';
    render();
    await loadSpells();
    state.screen = 'home';
    render();
  });

  document.getElementById('login-lang-btn')?.addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'de' : 'en';
    localStorage.setItem('spell-db-lang', state.lang);
    render();
  });

  // Changelog expand/collapse
  document.querySelectorAll('.changelog-collapsed').forEach(el => {
    el.addEventListener('click', () => {
      const i = parseInt(el.dataset.changelog);
      const entry = CHANGELOG[i];
      if (!entry) return;
      const l = state.lang;
      const items = l === 'en' ? entry.items_en : entry.items_de;
      const title = l === 'en' ? entry.title_en : entry.title_de;
      const expanded = document.createElement('div');
      expanded.className = 'changelog-expanded';
      expanded.dataset.changelog = i;
      expanded.innerHTML = '<span class="date" style="font-weight:600;color:var(--accent-gold);font-size:11px">' + entry.date + ' — ' + escHtml(title) + '</span><ul>' + items.map(item => '<li>' + escHtml(item) + '</li>').join('') + '</ul>';
      expanded.style.cursor = 'pointer';
      expanded.addEventListener('click', () => { expanded.replaceWith(el); });
      el.replaceWith(expanded);
    });
  });
}
