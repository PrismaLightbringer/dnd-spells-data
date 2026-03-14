# D&D 5e Spell Compendium — Project Context

## Overview
A bilingual (English/German) D&D 5e 2024 spell database web app with user accounts, bookmark sync, and a roadmap toward character sheets, rules glossary, and homebrew support.

**Live URL:** https://warm-stroopwafel-567af3.netlify.app/
**Repo:** https://github.com/PrismaLightbringer/dnd-spells-data
**Target audience:** A small D&D friend group (not public-scale)

## Architecture

| Service | Hosts | Purpose |
|---------|-------|---------|
| GitHub | `spells.json` + app files | Spell data (fetched at runtime) + frontend code |
| Netlify | Serves the app | Auto-deploys from this repo (or manual drag) |
| Firebase Firestore | `users`, `bookmarks` collections | Auth + cloud sync |

**Data flow:** Browser loads from Netlify → fetches `spells.json` from GitHub raw URL → login/bookmarks via Firebase Firestore.

## File Structure

```
index.html      — HTML shell + all CSS (styles only, no JS)
app.js          — Config, state, Firebase init, auth, theme, helpers, render router
login.js        — Login/register screen, changelog data, changelog expand/collapse
home.js         — Home dashboard (search, prepared spells, feature cards)
spells.js       — Spell list page (filtering, rendering, events)
spells.json     — 391 spells with slug IDs, bilingual EN/DE
CLAUDE.md       — This file
CHANGELOG.md    — Version history
```

**Script load order matters:** `login.js`, `home.js`, `spells.js` must load BEFORE `app.js` because `app.js` contains the `init()` IIFE that calls render functions defined in the other files.

## Tech Stack
- Vanilla JS (no framework, no build step)
- Firebase Firestore (compat SDK v10.12.0, loaded via CDN)
- Google Fonts: Cinzel (display), Alegreya (body), Alegreya Sans (UI)
- CSS custom properties for theming (light + dark mode)
- Single-page app with client-side routing via `state.screen`

## State Management
All app state lives in a global `state` object in `app.js`. Screens are routed by `state.screen`:
- `loading` → spinner
- `login` → login/register form
- `home` → dashboard with search, bookmarks, feature cards
- `spells` → spell list with filters

The `render()` function in `app.js` reads `state.screen` and calls the appropriate `renderX()` + `attachXEvents()` functions.

## Firebase Schema

### Active Collections
**users** (doc ID = lowercase username)
```json
{ "name": "Kravin", "passwordHash": "sha256...", "createdAt": "2026-03-14T..." }
```

**bookmarks** (doc ID = lowercase username)
```json
{ "spells": ["fireball", "shield", "misty-step"], "updatedAt": "2026-03-14T..." }
```

Users and bookmarks are linked by username. Deleting a user doc and re-registering with the same name preserves bookmarks.

### Planned Collections
- **characters** — ability scores, class, level, skills, prepared spells
- **homebrew** — custom/modified spells, group-level overrides

## Firebase Config
```js
const firebaseConfig = {
  apiKey: "AIzaSyCgeYhYMpihjMfWhBct9ieifSzW63vbUVY",
  authDomain: "dnd-spell-db.firebaseapp.com",
  projectId: "dnd-spell-db",
  storageBucket: "dnd-spell-db.firebasestorage.app",
  messagingSenderId: "712704145359",
  appId: "1:712704145359:web:737d2dbe109b0e065344ba"
};
```

## Spell Data Format (spells.json)
Each spell has:
```json
{
  "id": "fireball",
  "name_en": "Fireball", "name_de": "Feuerball",
  "level": 3,
  "school_en": "Evocation", "school_de": "Hervorrufung",
  "classes_en": ["Sorcerer", "Wizard"], "classes_de": ["Zauberer", "Magier"],
  "casting_en": "Action", "casting_de": "Aktion",
  "range_en": "150 feet", "range_de": "45 Meter",
  "components_en": "V, S, M (a ball of bat guano and sulfur)",
  "components_de": "V, G, M (eine Kugel aus Fledermauskot und Schwefel)",
  "duration_en": "Instantaneous", "duration_de": "Unmittelbar",
  "desc_en": "...", "desc_de": "..."
}
```

IDs are slugs generated from English names. All 391 spells from D&D 5e 2024 PHB.

## Current Features (v1.8)
- 391 bilingual spells (EN/DE) with slug IDs
- Filters: Level, School, Class, Casting Time, Range, Concentration, Ritual, Material Cost
- Bilingual search across both languages simultaneously
- Name + password casual login (SHA-256 hashed in Firestore)
- Bookmark/favorites with cloud sync
- Multi-expand in bookmark view + Expand/Collapse all
- Dark / light / auto theme
- Home dashboard with search, prepared spell chips, feature cards
- "What's New" changelog on login page (bilingual, expandable)
- Clickable title navigates home, search clear button
- Mobile-friendly responsive design

## Coding Conventions
- All user-facing text must be bilingual (EN/DE), using `state.lang` to switch
- Use `escHtml()` for all dynamic content inserted into HTML strings
- CSS uses `var(--name)` custom properties — never hardcode colors
- Level badge colors: cantrip=#6b7280, 1=#059669, 2=#0891b2, 3=#2563eb, 4=#7c3aed, 5=#a855f7, 6=#dc2626, 7=#ea580c, 8=#b45309, 9=#92400e
- Filter helpers (isConcentration, isRitual, hasMaterialCost, etc.) are in `spells.js`
- New features should be added as new `.js` files (e.g. `charsheet.js`)
- Load new JS files in `index.html` BEFORE `app.js`
- Add new screens to the `render()` router in `app.js`

## Upcoming Work (Priority Order)
1. **Character sheet MVP** — identity, 6 ability scores, auto-computed modifiers, skills with proficiency (none/proficient/expertise = 0/1/2), saving throws grouped under abilities, AC/HP/speed/size, proficiency bonus. Mockup approved. Firebase `characters` collection. New file: `charsheet.js`
2. **Spell descriptions update** — verify/update from source PDFs
3. **Stat blocks for summon spells** — new `statblock` field in spells.json
4. **Spell card layout** for favorites/bookmark view
5. **UI polish** — unified level colors, header, footer
6. **Website name/URL** — replace warm-stroopwafel
7. **Legal review** for D&D content usage
8. **Firebase security rules** — currently in test mode
9. **Connect GitHub → Netlify** for auto-deploy

## Future Features (Roadmap)
- **Phase 2:** Character sheets (class, subclass, species, background, stats, spell slots, multiclass support, level-up assistant, shareable URLs). Needs new data files: classes.json, species.json, backgrounds.json
- **Phase 3:** Rules glossary (conditions, actions, keywords), species traits, class/subclass features
- **Phase 4:** Homebrew (custom spells, group overrides, export/import)
- **Phase 5:** Character builder (all species, classes, subclasses, backgrounds at a glance)

## Design Notes
- Multiclassing must be supported in character sheet data model
- Skill proficiency is three-state: 0 (none), 1 (proficient), 2 (expertise)
- Character sheet saves to Firebase `characters` collection, doc ID auto-generated, `owner` field = lowercase username
- Spell slot tables will be embedded in JS for MVP, later moved to classes.json
- Homebrew layers on top of base GitHub data — Firebase overrides merge at load time

## Important Gotchas
- `app.js` must load LAST (contains init IIFE)
- `const` declarations in JS have a temporal dead zone — don't reference them before their file loads
- GitHub raw URLs can be slow/cached — spell loading has retry logic with cache-busting
- Firebase is in test mode — anyone with the config can read/write. Lock down before going wider.
- The app uses `innerHTML` string building, not a virtual DOM — be careful with XSS, always use `escHtml()`
