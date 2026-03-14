// ── Render Home ──
function renderHome() {
  const l = state.lang;
  const bmSpells = state.spells.filter(s => state.bookmarks.has(s.id));
  bmSpells.sort((a, b) => {
    const nA = (l === 'en' ? a.name_en : a.name_de).toLowerCase();
    const nB = (l === 'en' ? b.name_en : b.name_de).toLowerCase();
    return nA.localeCompare(nB, l === 'de' ? 'de' : 'en');
  });

  const lvlClass = lv => lv === 0 ? 'level-cantrip' : 'level-' + lv;

  let html = '<div class="home-page">';

  // Header
  html += '<div class="home-header"><h1>' + (l === 'en' ? 'Spell Compendium' : 'Zauberkompendium') + '</h1>' +
    '<div class="tagline">D&D 5e 2024 · English / Deutsch</div>';
  if (state.user) {
    html += '<div class="user-greeting">' + (l === 'en' ? 'Welcome back, ' : 'Willkommen zurück, ') + '<strong>' + escHtml(state.user.name) + '</strong></div>';
  }
  html += '</div>';

  // Search
  html += '<div class="home-search"><span class="icon">🔍</span>' +
    '<input id="home-search-input" type="text" placeholder="' + (l === 'en' ? 'Search all spells...' : 'Alle Zauber durchsuchen...') + '" /></div>';

  // Quick spells (bookmarks)
  if (bmSpells.length > 0) {
    html += '<div class="quick-spells-section"><div class="section-label">★ ' + (l === 'en' ? 'Your Prepared Spells (' + bmSpells.length + ')' : 'Deine vorbereiteten Zauber (' + bmSpells.length + ')') + '</div><div class="quick-spells">';
    bmSpells.forEach(s => {
      const name = l === 'en' ? s.name_en : s.name_de;
      const isOpen = state.homeExpanded === s.id;
      html += '<div class="quick-spell ' + (isOpen ? 'active' : '') + '" data-spell-id="' + s.id + '"><span class="lvl ' + lvlClass(s.level) + '">' + (s.level === 0 ? 'C' : s.level) + '</span><span class="name">' + escHtml(name) + '</span></div>';
    });
    html += '<div class="quick-spells-more" id="btn-view-all-bookmarks">' + (l === 'en' ? 'View all →' : 'Alle anzeigen →') + '</div>';
    html += '</div>';

    // Inline spell detail
    if (state.homeExpanded) {
      const s = bmSpells.find(x => x.id === state.homeExpanded);
      if (s) {
        const casting = l === 'en' ? s.casting_en : s.casting_de;
        const range = l === 'en' ? s.range_en : s.range_de;
        const components = l === 'en' ? s.components_en : s.components_de;
        const duration = l === 'en' ? s.duration_en : s.duration_de;
        const classes = l === 'en' ? s.classes_en : s.classes_de;
        const desc = l === 'en' ? s.desc_en : s.desc_de;
        const name = l === 'en' ? s.name_en : s.name_de;
        const altName = l === 'en' ? s.name_de : s.name_en;
        const school = l === 'en' ? s.school_en : s.school_de;

        html += '<div class="home-spell-detail" style="background:var(--bg-card);border:1px solid var(--accent-gold);border-radius:var(--radius-md);padding:14px 16px;margin-top:8px;animation:slideDown 0.2s ease">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div>';
        html += '<span style="font-family:var(--font-body);font-weight:600;font-size:16px">' + escHtml(name) + '</span>';
        html += ' <span style="font-family:var(--font-ui);font-size:12px;color:var(--text-muted);font-style:italic">' + escHtml(altName) + '</span>';
        html += '</div><span style="font-family:var(--font-ui);font-size:11px;color:var(--text-muted)">' + escHtml(school) + '</span></div>';
        html += '<div class="spell-meta-grid">' +
          '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Casting Time' : 'Zeitaufwand') + ':</b> ' + escHtml(casting) + '</div>' +
          '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Range' : 'Reichweite') + ':</b> ' + escHtml(range) + '</div>' +
          '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Components' : 'Komponenten') + ':</b> ' + escHtml(components) + '</div>' +
          '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Duration' : 'Wirkungsdauer') + ':</b> ' + escHtml(duration) + '</div>' +
          '</div>';
        html += '<div class="spell-classes" style="margin-bottom:8px"><b>' + (l === 'en' ? 'Classes' : 'Klassen') + ':</b> ' +
          classes.map(c => '<span class="class-tag">' + escHtml(c) + '</span>').join('') + '</div>';
        html += '<div style="font-family:var(--font-body);font-size:14px;line-height:1.6;white-space:pre-wrap">' + escHtml(desc) + '</div>';
        html += '</div>';
      }
    }

    html += '</div>';
  }

  // Feature cards
  html += '<div class="section-label">' + (l === 'en' ? 'Features' : 'Funktionen') + '</div>';
  html += '<div class="features-grid">';
  html += '<div class="feature-card active" id="card-spells"><span class="fc-icon">📖</span><span class="fc-title">' + (l === 'en' ? 'Spell Database' : 'Zauberdatenbank') + '</span><span class="fc-desc">' + state.spells.length + (l === 'en' ? ' spells · EN/DE · Search, filter, bookmark' : ' Zauber · EN/DE · Suche, Filter, Lesezeichen') + '</span><span class="fc-badge fc-badge-live">Live</span></div>';
  html += '<div class="feature-card coming-soon"><span class="fc-icon">⚔️</span><span class="fc-title">' + (l === 'en' ? 'Character Sheets' : 'Charakterbögen') + '</span><span class="fc-desc">' + (l === 'en' ? 'Class, stats, spell slots, level-up tracking' : 'Klasse, Werte, Zauberplätze, Stufenaufstieg') + '</span><span class="fc-badge fc-badge-soon">' + (l === 'en' ? 'Coming soon' : 'Bald verfügbar') + '</span></div>';
  html += '<div class="feature-card coming-soon"><span class="fc-icon">📜</span><span class="fc-title">' + (l === 'en' ? 'Rules Glossary' : 'Regelglossar') + '</span><span class="fc-desc">' + (l === 'en' ? 'Conditions, actions, keywords — quick reference' : 'Zustände, Aktionen, Begriffe — Schnellreferenz') + '</span><span class="fc-badge fc-badge-soon">' + (l === 'en' ? 'Coming soon' : 'Bald verfügbar') + '</span></div>';
  html += '<div class="feature-card coming-soon"><span class="fc-icon">🧪</span><span class="fc-title">' + (l === 'en' ? 'Homebrew' : 'Eigenkreationen') + '</span><span class="fc-desc">' + (l === 'en' ? 'Custom spells, house rules, campaign overrides' : 'Eigene Zauber, Hausregeln, Kampagnenanpassungen') + '</span><span class="fc-badge fc-badge-soon">' + (l === 'en' ? 'Coming soon' : 'Bald verfügbar') + '</span></div>';
  html += '<div class="feature-card coming-soon"><span class="fc-icon">🛡️</span><span class="fc-title">' + (l === 'en' ? 'Character Builder' : 'Charakterbaukasten') + '</span><span class="fc-desc">' + (l === 'en' ? 'Species, classes, subclasses, backgrounds — all options at a glance' : 'Spezies, Klassen, Unterklassen, Hintergründe — alle Optionen im Überblick') + '</span><span class="fc-badge fc-badge-soon">' + (l === 'en' ? 'Coming soon' : 'Bald verfügbar') + '</span></div>';
  html += '</div>';

  // Footer
  html += '<div class="home-footer"><div class="links">';
  html += '<a id="home-lang">' + (l === 'en' ? 'EN 🇬🇧' : 'DE 🇩🇪') + '</a>';
  html += '<a id="home-theme">' + themeIcon() + '</a>';
  if (state.user) { html += '<a id="home-logout">' + (l === 'en' ? 'Log out' : 'Abmelden') + '</a>'; }
  html += '</div>';
  html += '<div class="copy">' + (l === 'en' ? 'Spell Compendium · Not affiliated with Wizards of the Coast' : 'Zauberkompendium · Nicht verbunden mit Wizards of the Coast') + '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ── Home Events ──
function attachHomeEvents() {
  const searchInput = document.getElementById('home-search-input');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      state.query = searchInput.value.trim();
      state.screen = 'spells';
      render();
    }
  });
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (e.target.value.trim().length >= 2) {
        state.query = e.target.value.trim();
        state.screen = 'spells';
        render();
        const el = document.getElementById('search-input');
        if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
      }
    }, 400);
  });

  document.getElementById('card-spells')?.addEventListener('click', () => {
    state.screen = 'spells';
    render();
  });

  document.querySelectorAll('.quick-spell').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.spellId;
      state.homeExpanded = state.homeExpanded === id ? null : id;
      render();
    });
  });

  document.getElementById('btn-view-all-bookmarks')?.addEventListener('click', () => {
    state.screen = 'spells';
    state.filterBookmarks = true;
    render();
  });

  document.getElementById('home-lang')?.addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'de' : 'en';
    localStorage.setItem('spell-db-lang', state.lang);
    render();
  });
  document.getElementById('home-theme')?.addEventListener('click', cycleTheme);
  document.getElementById('home-logout')?.addEventListener('click', () => {
    localStorage.removeItem('spell-db-user');
    state.user = null;
    state.bookmarks = new Set();
    state.screen = 'login';
    state.loginMode = 'login';
    state.loginError = '';
    render();
  });
}
