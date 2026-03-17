

# CLASS_CONVERSION_BRIEF.md

## Purpose
This document is the standard briefing for converting a D&D class from the Player's Handbook into the project's JSON schema. Read this before starting any class conversion.

## Step 1 — Read SCHEMA.md first
Before converting any class, read SCHEMA.md in full. All rules are non-negotiable. Do not introduce patterns that conflict with existing rules.

## Step 2 — What to produce
For each class, produce the following collections as separate JSON outputs:

- `classes` — one entry for the class
- `class_progressions` — one entry with all 20 levels
- `features` — one entry per class feature and subclass feature
- `subclasses` — one entry per subclass (identity only)
- `entities` — one entry per reusable object if applicable

## Step 3 — Rules to follow strictly

**Resources**
All level-based scaling must live in `class_progressions.levels[].resources`. Features must never contain scaling tables or level ranges internally. Features reference resources using `_from_resource` fields.

**Single source of truth**
A value must be defined in exactly one place, typically the progression table, and referenced elsewhere. Do not duplicate scaling or derived values across features.

**Every level entry must be self-contained**
Every level must include proficiency bonus, feature IDs, spell slots if applicable, and all resources — even if unchanged from the previous level.

**Spell slot tables**
Use shared reference tables rather than embedding full slot tables per class:
- `"spell_slot_table": "full_caster"` — Cleric, Druid, Sorcerer, Wizard, Bard
- `"spell_slot_table": "half_caster"` — Paladin, Ranger
- `"spell_slot_table": "third_caster"` — Eldritch Knight, Arcane Trickster (subclass level only, not base class)
- Warlock uses Pact Magic — do not use a slot table, see Pact Magic rule below

**Pact Magic (Warlock only)**
Warlock does not use a standard slot table. Model as:
```json
{
  "type": "spellcasting",
  "casting_model": "pact_magic",
  "slot_count": 2,
  "slot_level": 3,
  "recharge": "short_rest"
}
```
Values scale via progression table resources.

**Features contain text, choices, and grants only**
No scaling, no derived numbers, no progression logic inside features.

**No formula strings**
Use structured objects instead:
```json
{ "base": 10, "modifiers": ["dexterity", "constitution"] }
```
Never: `"10 + dex + con"`

**Player choice flag required on every feature**
Every feature must include `"player_choice": true` or `"player_choice": false`. If true, a `"choice_prompt"` field is also required.

**Subclass spell packages**
Always modeled as `always_prepared_spell` grants with a class-level threshold field. No separate spell list collection.

**Channel Divinity and similar shared resources**
The resource lives in the progression table. Multiple features may reference the same resource using `uses_resource`. Named options with their own rules text must be separate features, not inline references.

**Stateful mechanics must be explicit**
Use `"type": "state"` to define a state. States are used for transformations (Wild Shape), combat modes (Rage), and sustained buffs (Elemental Attunement).

**State-linked mechanics use `while_state`**
Do not place mechanics inside the state grant. Use separate grants:
```json
{ "type": "damage_bonus", "value": 2, "while_state": "rage" }
```

**State-based choice reset**
Some choices reset when a state is activated:
```json
{ "replace_on": "rage" }
```

**State replacement**
Some features replace one state with another:
```json
{ "type": "state", "replaces_state": "wild_shape" }
```

**Auras**
Auras are passive spatial fields centered on a character. The aura grant defines the field itself. Any mechanical benefits must be separate grants using `while_aura`:
```json
{ "type": "aura", "aura_id": "aura_of_protection", "radius_feet": 10, "targets": "allies" }
{ "type": "saving_throw_bonus", "value": "charisma_modifier", "targets": "allies", "while_aura": "aura_of_protection" }
```
Never nest mechanics inside the aura grant.

**Choice options are self-contained packages**
Each choice option can contain its own `id`, `name`, `text`, and `grants`. Treat them as mini-features.

**Costed choice options**
A choice option may define its own resource cost:
```json
{
  "type": "choice",
  "options": [
    {
      "id": "poison",
      "cost": { "resource": "sneak_attack_dice", "amount": 1 },
      "grants": []
    }
  ]
}
```

**Choice upgrades**
When a later feature modifies a previous player choice, use `"type": "choice_upgrade"` referencing the original feature ID.

**Named reusable options must be separate features**
Any named mechanic with its own rules text that is referenced by ID must be a separate feature, not an inline reference.

**No effects arrays**
There is no effects system. All mechanics are expressed as grants. Never use nested `effects` arrays anywhere.

**Prerequisites**
Prerequisites fall into three categories:

1. Soft prerequisites — descriptive only, not machine-validated. Can remain in text.
2. Hard structural prerequisites — machine-readable:
```json
{ "prerequisites": { "level": 5, "class_id": "warlock", "feature_ids": ["pact-of-the-blade"] } }
```
3. Build-defining choice dependencies — based on prior player selections:
```json
{ "prerequisites": { "chosen_options": [{ "choice_id": "warlock_pact", "option_id": "pact_blade" }] } }
```
Only structural prerequisites and build-defining choice dependencies must be represented explicitly.

**Recharge vs Refresh**
These are distinct and must not be confused:
- `recharge` — time or event based (short-rest, long-rest, per_state, on_spell_cast)
- `feature_refresh` — resource-based reset:
```json
{ "type": "feature_refresh", "feature_id": "...", "cost": { "resource": "pact_spell_slot", "amount": 1 } }
```

**Recharge trigger types**
All recharge conditions must be explicitly defined:
- Rest-based: `"short-rest"`, `"long-rest"`
- State-based: `{ "recharge": "per_state", "state_id": "rage" }` — never encode state inside the string
- Event-based: `"on_spell_cast"`, `"on_wild_surge"`, `"on_initiative"`

**Triggered effects**
Distinct from recharge. Must define trigger explicitly:
```json
{ "type": "triggered_effect", "trigger": "on_spell_cast" }
```

**Triggered resource restore**
Must define both trigger and target resource:
```json
{ "type": "triggered_resource_restore", "resource": "spell_slots", "trigger": "cast_divination_spell", "amount": 1 }
```
Conditional restore thresholds:
```json
{ "type": "triggered_resource_restore", "resource": "bardic_inspiration_uses", "trigger": "on_initiative", "minimum": 2 }
```
`minimum` means: restore up to that value if current amount is below it.

**Spellbook (Wizard)**
```json
{ "type": "spellbook", "initial_spells": 6, "add_per_level": 2 }
```
The schema defines how spellbooks grow. The character stores actual spell IDs in character data, not in class definitions.

**Secondary HP pools**
```json
{ "type": "secondary_hp_pool", "pool_id": "arcane_ward", "max_hp_from_resource": "arcane_ward_hp", "recharge": "long-rest" }
```
Must be tracked separately from normal HP.

**Stored roll pools**
```json
{ "type": "stored_roll_pool", "pool_id": "portent_rolls", "dice_count": 2, "die": "d20", "recharge": "long-rest", "usage": "replace_roll" }
```
These are neither resources nor states.

**Stat override (Wild Shape)**
```json
{
  "type": "stat_override",
  "replaces": ["strength", "dexterity", "constitution", "ac", "speed", "hp"],
  "retains": ["intelligence", "wisdom", "charisma", "proficiencies"],
  "source_entity": "beast"
}
```

**Entity filtering**
```json
{ "type": "entity_filter", "conditions": { "max_cr": "...", "allow_fly": false } }
```

**Wild Magic surge table**
Exclude from conversion. Reference by placeholder only:
```json
{ "table": "wild-magic-surge-table" }
```

## Step 4 — What to flag rather than guess
Flag explicitly rather than inventing a solution if you encounter:
- A mechanic that doesn't fit any existing grant type
- A resource that scales in a way not seen before
- A feature level structure that differs from other classes
- Anything involving spell origin override, layered states, or multiclass interactions
- Persistent buff durations that behave differently from fixed durations or resource limits

## Step 5 — Completion checklist
Before submitting output for any class, verify:

- [ ] Resources appear on every level entry
- [ ] All 20 levels exist
- [ ] No scaling tables inside features
- [ ] Every feature has `player_choice`
- [ ] All subclass features are included
- [ ] Named Channel Divinity options or equivalents are separate features
- [ ] Subclass spell packages use `always_prepared_spell`
- [ ] No formula strings anywhere
- [ ] No effects arrays anywhere
- [ ] Slot progression uses shared tables where applicable
- [ ] Pact Magic modeled separately if applicable
- [ ] All recharge conditions explicitly defined
- [ ] State-linked mechanics use `while_state`
- [ ] Aura-linked mechanics use `while_aura`
- [ ] Costed choice options include explicit cost objects

## Provisional Grant Types
These have been introduced but are not yet fully standardized:
- `resource_conversion`
- `spell_cost_override`
- `spell_component_override`
- `damage_reduction_pool`
- `minimum_roll_override`
- `prevent_advantage_against_self`
- `spell_effect_transformation`
- `restriction`
- `restriction_override`
- `state_application`
- `spell_range_override`
- `temporary_spell_access`

## Known Future Pressure Points
- Spell origin override (familiars, Invoke Duplicity, Echo Knight)
- Layered states (rage + subclass state, Wild Shape + buff)
- Persistent buff durations ("until reused or long rest")
- Aura stacking and duplicate aura resolution
- Target-applied persistent states (e.g. Quivering Palm)
- Multiclass interactions
- Spellbook storage in character data (Firebase)
- Secondary HP pool UI tracking
- Runtime distinction between recharge, refresh, triggered effects, and triggered restore

## Reference
Schema version: v1.1
Validated against: Ranger, Fighter, Barbarian, Cleric, Sorcerer (partial), Wizard (scan), Druid (scan), Warlock (scan), Paladin (scan), Monk (scan), Bard (scan), Rogue (scan)
Last updated: March 17 2026
