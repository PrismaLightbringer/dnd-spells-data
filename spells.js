// ── Spell Helpers ──
function isConcentration(s) { return s.duration_en.toLowerCase().startsWith('concentration'); }
function isRitual(s) { return s.casting_en.toLowerCase().includes('ritual'); }
function hasMaterialCost(s) { return /\d+\+?\s*gp/i.test(s.components_en); }

function getCastingCategory(s) {
  const c = s.casting_en.toLowerCase();
  if (c.startsWith('bonus')) return 'bonus';
  if (c.startsWith('reaction')) return 'reaction';
  if (c === 'action') return 'action';
  return 'longer';
}

function getRangeCategory(s) {
  const r = s.range_en;
  if (r === 'Self') return 'self';
  if (r === 'Touch') return 'touch';
  const feet = parseInt(r);
  if (!isNaN(feet) && feet <= 30) return 'short';
  if (!isNaN(feet) && feet <= 90) return 'medium';
  if (!isNaN(feet) && feet <= 300) return 'long';
  return 'vlong';
}

// ── Filtering ──
function getFilteredSpells() {
  const filtered = state.spells.filter(s => {
    const q = state.query.toLowerCase();
    const matchQ = !q || s.name_en.toLowerCase().includes(q) || s.name_de.toLowerCase().includes(q) || s.desc_en.toLowerCase().includes(q) || s.desc_de.toLowerCase().includes(q);
    const matchLvl = state.filterLevel === 'all' || s.level === Number(state.filterLevel);
    const matchSch = state.filterSchool === 'all' || s.school_en === state.filterSchool;
    const matchCls = state.filterClass === 'all' || s.classes_en.includes(state.filterClass);
    const matchBm = !state.filterBookmarks || state.bookmarks.has(s.id);
    const matchConc = !state.filterConcentration || isConcentration(s);
    const matchRit = !state.filterRitual || isRitual(s);
    const matchMat = state.filterMaterialCost === 'all' || (state.filterMaterialCost === 'yes' ? hasMaterialCost(s) : !hasMaterialCost(s));
    const matchCast = state.filterCasting === 'all' || getCastingCategory(s) === state.filterCasting;
    const matchRange = state.filterRange === 'all' || getRangeCategory(s) === state.filterRange;
    return matchQ && matchLvl && matchSch && matchCls && matchBm && matchConc && matchRit && matchMat && matchCast && matchRange;
  });
  const lang = state.lang;
  filtered.sort((a, b) => {
    const nameA = (lang === 'en' ? a.name_en : a.name_de).toLowerCase();
    const nameB = (lang === 'en' ? b.name_en : b.name_de).toLowerCase();
    return nameA.localeCompare(nameB, lang === 'de' ? 'de' : 'en');
  });
  return filtered;
}

// ── Render Spells Page ──
function renderSpellsPage(filtered) {
  const l = state.lang;
  const schools = [...new Set(state.spells.map(s => s.school_en))].sort();
  const classes = [...new Set(state.spells.flatMap(s => s.classes_en))].sort();
  const levels = [...new Set(state.spells.map(s => s.level))].sort((a, b) => a - b);
  const classMapDE = {Bard:'Barde',Cleric:'Kleriker',Druid:'Druide',Paladin:'Paladin',Ranger:'Waldläufer',Sorcerer:'Zauberer',Warlock:'Hexenmeister',Wizard:'Magier'};
  const schoolMapDE = {Abjuration:'Bannzauber',Conjuration:'Beschwörung',Divination:'Erkenntnis',Enchantment:'Verzauberung',Evocation:'Hervorrufung',Illusion:'Illusion',Necromancy:'Nekromantie',Transmutation:'Verwandlung'};

  let html = '<div class="app-header"><div class="header-top"><div>' +
    '<div class="header-title" id="btn-home">' + (l === 'en' ? 'Spell Compendium' : 'Zauberkompendium') + '</div>' +
    '<div class="header-meta">' + state.spells.length + ' spells · D&D 5e 2024 · EN/DE</div>' +
    '</div><div class="header-actions">';

  if (state.user) {
    html += '<span class="user-badge"><strong>' + escHtml(state.user.name) + '</strong></span>';
  }

  html += '<button class="header-btn ' + (state.filterBookmarks ? 'active' : '') + '" id="btn-bookmarks" title="Show bookmarks only">★ ' + state.bookmarks.size + '</button>' +
    '<button class="header-btn" id="btn-lang">' + (l === 'en' ? 'EN 🇬🇧' : 'DE 🇩🇪') + '</button>' +
    '<button class="header-btn" id="btn-theme">' + themeIcon() + '</button>';

  if (state.user) {
    html += '<button class="header-btn" id="btn-logout" title="Log out">↪</button>';
  }

  html += '</div></div>' +
    '<div class="search-bar"><span class="search-icon">🔍</span>' +
    '<input id="search-input" type="text" placeholder="' + (l === 'en' ? 'Search spells...' : 'Zauber suchen...') + '" value="' + escHtml(state.query) + '" />' +
    (state.query ? '<button class="search-clear" id="btn-search-clear" title="Clear">✕</button>' : '') +
    '</div>' +
    '<div class="filters-row">' +
    '<select class="filter-select" id="filter-level"><option value="all">' + (l === 'en' ? 'All Levels' : 'Alle Grade') + '</option>';

  levels.forEach(lv => {
    html += '<option value="' + lv + '"' + (state.filterLevel == lv ? ' selected' : '') + '>' + (lv === 0 ? 'Cantrip' : (l === 'en' ? 'Level ' : 'Grad ') + lv) + '</option>';
  });

  html += '</select><select class="filter-select" id="filter-school"><option value="all">' + (l === 'en' ? 'All Schools' : 'Alle Schulen') + '</option>';
  schools.forEach(s => {
    html += '<option value="' + s + '"' + (state.filterSchool === s ? ' selected' : '') + '>' + (l === 'en' ? s : (schoolMapDE[s] || s)) + '</option>';
  });

  html += '</select><select class="filter-select" id="filter-class"><option value="all">' + (l === 'en' ? 'All Classes' : 'Alle Klassen') + '</option>';
  classes.forEach(c => {
    html += '<option value="' + c + '"' + (state.filterClass === c ? ' selected' : '') + '>' + (l === 'en' ? c : (classMapDE[c] || c)) + '</option>';
  });

  html += '</select><select class="filter-select" id="filter-casting"><option value="all">' + (l === 'en' ? 'Casting Time' : 'Zeitaufwand') + '</option>' +
    '<option value="action"' + (state.filterCasting === 'action' ? ' selected' : '') + '>' + (l === 'en' ? 'Action' : 'Aktion') + '</option>' +
    '<option value="bonus"' + (state.filterCasting === 'bonus' ? ' selected' : '') + '>' + (l === 'en' ? 'Bonus Action' : 'Bonusaktion') + '</option>' +
    '<option value="reaction"' + (state.filterCasting === 'reaction' ? ' selected' : '') + '>' + (l === 'en' ? 'Reaction' : 'Reaktion') + '</option>' +
    '<option value="longer"' + (state.filterCasting === 'longer' ? ' selected' : '') + '>' + (l === 'en' ? '1 min+' : '1 Min+') + '</option>' +
    '</select>';

  html += '<select class="filter-select" id="filter-range"><option value="all">' + (l === 'en' ? 'Range' : 'Reichweite') + '</option>' +
    '<option value="self"' + (state.filterRange === 'self' ? ' selected' : '') + '>' + (l === 'en' ? 'Self' : 'Selbst') + '</option>' +
    '<option value="touch"' + (state.filterRange === 'touch' ? ' selected' : '') + '>' + (l === 'en' ? 'Touch' : 'Berührung') + '</option>' +
    '<option value="short"' + (state.filterRange === 'short' ? ' selected' : '') + '>' + (l === 'en' ? '5–30 ft' : '1,5–9 m') + '</option>' +
    '<option value="medium"' + (state.filterRange === 'medium' ? ' selected' : '') + '>' + (l === 'en' ? '60–90 ft' : '18–27 m') + '</option>' +
    '<option value="long"' + (state.filterRange === 'long' ? ' selected' : '') + '>' + (l === 'en' ? '100–300 ft' : '30–90 m') + '</option>' +
    '<option value="vlong"' + (state.filterRange === 'vlong' ? ' selected' : '') + '>' + (l === 'en' ? '500 ft+' : '150 m+') + '</option>' +
    '</select>';

  html += '</div>';

  html += '<div class="filters-row-2">' +
    '<button class="filter-toggle ' + (state.filterConcentration ? 'active' : '') + '" id="btn-conc">' + (l === 'en' ? '⏳ Concentration' : '⏳ Konzentration') + '</button>' +
    '<button class="filter-toggle ' + (state.filterRitual ? 'active' : '') + '" id="btn-ritual">' + (l === 'en' ? '📖 Ritual' : '📖 Ritual') + '</button>' +
    '<select class="filter-select" id="filter-matcost" style="font-size:12px">' +
    '<option value="all">' + (l === 'en' ? '💰 Material Cost' : '💰 Materialkosten') + '</option>' +
    '<option value="yes"' + (state.filterMaterialCost === 'yes' ? ' selected' : '') + '>' + (l === 'en' ? 'Has GP cost' : 'Mit GP-Kosten') + '</option>' +
    '<option value="no"' + (state.filterMaterialCost === 'no' ? ' selected' : '') + '>' + (l === 'en' ? 'No GP cost' : 'Ohne GP-Kosten') + '</option>' +
    '</select>' +
    '</div>';

  html += '</div>';

  html += '<div class="results-bar"><span>' + (l === 'en' ? 'Showing ' + filtered.length + ' of ' + state.spells.length + ' spells' : 'Zeige ' + filtered.length + ' von ' + state.spells.length + ' Zaubern') + '</span>';
  if (state.filterBookmarks && filtered.length > 0) {
    const allExpanded = filtered.every(s => state.expanded.has(s.id));
    html += '<button class="expand-all-btn" id="btn-expand-all">' + (allExpanded ? (l === 'en' ? '▲ Collapse all' : '▲ Alle zuklappen') : (l === 'en' ? '▼ Expand all' : '▼ Alle aufklappen')) + '</button>';
  }
  html += '</div>';

  html += '<div class="spell-list">';

  if (filtered.length === 0 && state.spells.length === 0) {
    html += '<div class="empty-state"><div class="icon">⚠️</div>' + (l === 'en' ? 'Could not load spells. Check your connection and <a href="javascript:location.reload()" style="color:var(--accent-gold)">reload</a>.' : 'Zauber konnten nicht geladen werden. Prüfe deine Verbindung und <a href="javascript:location.reload()" style="color:var(--accent-gold)">lade neu</a>.') + '</div>';
  } else if (filtered.length === 0) {
    html += '<div class="empty-state"><div class="icon">🔮</div>' + (l === 'en' ? 'No spells match your filters.' : 'Keine Zauber entsprechen deinen Filtern.') + '</div>';
  } else {
    filtered.forEach(s => { html += renderSpellCard(s, l); });
  }

  html += '</div>';
  return html;
}

function renderSpellCard(s, l) {
  const isOpen = state.expanded.has(s.id);
  const name = l === 'en' ? s.name_en : s.name_de;
  const altName = l === 'en' ? s.name_de : s.name_en;
  const school = l === 'en' ? s.school_en : s.school_de;
  const isBookmarked = state.bookmarks.has(s.id);
  const lvlClass = s.level === 0 ? 'level-cantrip' : 'level-' + s.level;

  let html = '<div class="spell-card ' + (isOpen ? 'expanded' : '') + '" data-id="' + s.id + '">' +
    '<div class="spell-header" data-id="' + s.id + '">' +
    '<span class="level-badge ' + lvlClass + '">' + (s.level === 0 ? 'C' : s.level) + '</span>' +
    '<span class="spell-name">' + escHtml(name) + '</span>' +
    '<span class="spell-name-alt">' + escHtml(altName) + '</span>' +
    '<span class="spell-school">' + escHtml(school) + '</span>' +
    '<button class="bookmark-btn ' + (isBookmarked ? 'active' : '') + '" data-bookmark="' + s.id + '" title="Bookmark">★</button>' +
    '<span class="expand-arrow">▼</span></div>';

  if (isOpen) {
    const casting = l === 'en' ? s.casting_en : s.casting_de;
    const range = l === 'en' ? s.range_en : s.range_de;
    const components = l === 'en' ? s.components_en : s.components_de;
    const duration = l === 'en' ? s.duration_en : s.duration_de;
    const classes = l === 'en' ? s.classes_en : s.classes_de;
    const desc = l === 'en' ? s.desc_en : s.desc_de;

    html += '<div class="spell-details"><div class="spell-meta-grid">' +
      '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Casting Time' : 'Zeitaufwand') + ':</b> ' + escHtml(casting) + '</div>' +
      '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Range' : 'Reichweite') + ':</b> ' + escHtml(range) + '</div>' +
      '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Components' : 'Komponenten') + ':</b> ' + escHtml(components) + '</div>' +
      '<div class="spell-meta-item"><b>' + (l === 'en' ? 'Duration' : 'Wirkungsdauer') + ':</b> ' + escHtml(duration) + '</div>' +
      '</div>' +
      '<div class="spell-classes"><b>' + (l === 'en' ? 'Classes' : 'Klassen') + ':</b> ' +
      classes.map(c => '<span class="class-tag">' + escHtml(c) + '</span>').join('') + '</div>' +
      '<div class="spell-description">' + escHtml(desc) + '</div></div>';
  }

  html += '</div>';
  return html;
}

// ── Spells Events ──
function attachSpellsEvents(filtered) {
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const cursorPos = e.target.selectionStart;
    searchTimeout = setTimeout(() => {
      state.query = e.target.value;
      if (!state.filterBookmarks) state.expanded = new Set();
      render();
      const el = document.getElementById('search-input');
      if (el) { el.focus(); el.selectionStart = el.selectionEnd = cursorPos; }
    }, 200);
  });

  document.getElementById('btn-search-clear')?.addEventListener('click', () => {
    state.query = '';
    render();
  });

  document.getElementById('btn-home')?.addEventListener('click', () => {
    state.query = '';
    state.filterLevel = 'all';
    state.filterSchool = 'all';
    state.filterClass = 'all';
    state.filterCasting = 'all';
    state.filterRange = 'all';
    state.filterConcentration = false;
    state.filterRitual = false;
    state.filterMaterialCost = 'all';
    state.filterBookmarks = false;
    state.expanded = new Set();
    state.screen = 'home';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('filter-level')?.addEventListener('change', (e) => { state.filterLevel = e.target.value; if (!state.filterBookmarks) state.expanded = new Set(); render(); });
  document.getElementById('filter-school')?.addEventListener('change', (e) => { state.filterSchool = e.target.value; if (!state.filterBookmarks) state.expanded = new Set(); render(); });
  document.getElementById('filter-class')?.addEventListener('change', (e) => { state.filterClass = e.target.value; if (!state.filterBookmarks) state.expanded = new Set(); render(); });
  document.getElementById('filter-casting')?.addEventListener('change', (e) => { state.filterCasting = e.target.value; if (!state.filterBookmarks) state.expanded = new Set(); render(); });
  document.getElementById('filter-range')?.addEventListener('change', (e) => { state.filterRange = e.target.value; if (!state.filterBookmarks) state.expanded = new Set(); render(); });

  document.getElementById('btn-conc')?.addEventListener('click', () => { state.filterConcentration = !state.filterConcentration; render(); });
  document.getElementById('btn-ritual')?.addEventListener('click', () => { state.filterRitual = !state.filterRitual; render(); });
  document.getElementById('filter-matcost')?.addEventListener('change', (e) => { state.filterMaterialCost = e.target.value; render(); });

  document.getElementById('btn-lang')?.addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'de' : 'en';
    localStorage.setItem('spell-db-lang', state.lang);
    render();
  });

  document.getElementById('btn-theme')?.addEventListener('click', cycleTheme);

  document.getElementById('btn-bookmarks')?.addEventListener('click', () => {
    state.filterBookmarks = !state.filterBookmarks;
    if (!state.filterBookmarks) state.expanded = new Set();
    render();
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('spell-db-user');
    state.user = null;
    state.bookmarks = new Set();
    state.screen = 'login';
    state.loginMode = 'login';
    state.loginError = '';
    render();
  });

  document.getElementById('btn-expand-all')?.addEventListener('click', () => {
    const allExpanded = filtered.every(s => state.expanded.has(s.id));
    if (allExpanded) {
      state.expanded = new Set();
    } else {
      filtered.forEach(s => state.expanded.add(s.id));
    }
    render();
  });

  document.querySelectorAll('.spell-header').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-btn')) return;
      const id = el.dataset.id;
      if (state.filterBookmarks) {
        if (state.expanded.has(id)) { state.expanded.delete(id); }
        else { state.expanded.add(id); }
      } else {
        if (state.expanded.has(id)) { state.expanded = new Set(); }
        else { state.expanded = new Set([id]); }
      }
      render();
    });
  });

  document.querySelectorAll('.bookmark-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.bookmark;
      if (state.bookmarks.has(id)) { state.bookmarks.delete(id); }
      else { state.bookmarks.add(id); }
      saveBookmarks();
      render();
    });
  });
}
