Here is the **final schema version** in a clean reference form.

---

# SCHEMA.md

## Version

**v1.1**

## Status

**Stable across all PHB classes scanned**

Validated against:

* Ranger
* Fighter
* Barbarian
* Cleric
* Sorcerer
* Wizard
* Druid
* Warlock
* Paladin
* Monk
* Bard
* Rogue

---

# 1. Core Collections

The system uses five primary collections:

* `classes`
* `class_progressions`
* `features`
* `subclasses`
* `entities`

Spell data lives in the existing spell database and is referenced by ID.

---

# 2. Collection Definitions

## 2.1 `classes`

Defines static class identity.

Contains:

* `id`
* `name`
* `hit_die`
* `primary_abilities`
* `saving_throw_proficiencies`
* `proficiencies`
* `starting_equipment`
* `multiclass_rules` if needed
* `subclass_level`

Does **not** contain:

* level progression
* scaling values
* feature logic

---

## 2.2 `class_progressions`

Defines the level table for a class.

Contains:

* `class_id`
* optional shared slot table reference
* `levels[]`

Each level entry contains:

* `level`
* `proficiency_bonus`
* `feature_ids`
* `spell_slots` if applicable
* `resources`

### Rule: Every level entry is self-contained

Every level must include:

* proficiency bonus
* feature IDs
* spell slots if applicable
* all resources, even if unchanged from previous level

### Rule: Single source of truth

Scaling values must be defined in exactly one place, usually `class_progressions.levels[].resources`, and referenced elsewhere.

---

## 2.3 `features`

Represents class and subclass features.

Contains:

* `id`
* `owner_type` (`class` or `subclass`)
* `owner_id`
* `level`
* `name`
* `player_choice`
* `choice_prompt` when needed
* `text`
* `grants`

Features contain:

* text
* choice metadata
* grants

Features do **not** contain:

* scaling tables
* progression logic
* formula strings
* effects arrays

---

## 2.4 `subclasses`

Defines subclass identity only.

Contains:

* `id`
* `class_id`
* `name`
* `feature_levels`

Subclass mechanics live in `features`.

---

## 2.5 `entities`

Reusable referenced objects.

Examples:

* companion stat blocks
* beast forms
* maneuvers
* metamagic options
* invocations

---

# 3. Progression Rules

## 3.1 Scaling lives in progression

All level-based scaling must live in `class_progressions.levels[].resources`.

Features reference scaling using `*_from_resource` fields.

Example:

```json
{
  "dice": {
    "count_from_resource": "divine_spark_dice",
    "die": "d8"
  }
}
```

## 3.2 No scaling inside features

Features must never define:

* level ranges
* scaling arrays
* internal progression tables

---

# 4. Spell Slot Models

## 4.1 Shared slot tables

Use shared slot progression references instead of embedding full tables in every class.

Examples:

* `"spell_slot_table": "full_caster"`
* `"spell_slot_table": "half_caster"`
* `"spell_slot_table": "third_caster"`

Third caster note
"third_caster" applies at the subclass level, not the base class level.
Eldritch Knight (Fighter) and Arcane Trickster (Rogue) inherit their base class progression and add spellcasting via subclass features.
Do not assign a "spell_slot_table" to Fighter or Rogue at the class level.

## 4.2 Pact Magic

Warlock is the only major divergent spellcasting model.

Example:

```json
{
  "type": "spellcasting",
  "casting_model": "pact_magic",
  "slot_count": 2,
  "slot_level": 3,
  "recharge": "short_rest"
}
```

Values scale via progression resources.

---

# 5. Choice System

## 5.1 Every feature needs `player_choice`

Every feature must include:

* `"player_choice": true` or
* `"player_choice": false`

If true, it must also include:

* `"choice_prompt"`

## 5.2 Choice options are self-contained

Choice options are mini-features and may contain:

* `id`
* `name`
* `text`
* `grants`

## 5.3 Costed choice options

A specific choice option may define its own resource cost.

Example:

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

## 5.4 Choice upgrades

When a later feature modifies an earlier player choice, use:

```json
{
  "type": "choice_upgrade",
  "choice_feature_id": "cleric-blessed-strikes"
}
```

## 5.5 Build-defining choices

Some choices create persistent dependencies for later features.

Examples:

* subclass
* pact boon
* fighting style
* divine order

These are represented as machine-readable prior choices in prerequisites.

---

# 6. Grants Model

## 6.1 No effects arrays

There is no separate effects system.

All mechanics are modeled as grants.

Do not use:

* nested `effects`
* `effects[]` arrays
* free-floating logic labels

## 6.2 Grant vocabulary

Grant types are currently descriptive and consistent, but not yet formally closed or fully enumerated.

The current working set of less-common or evolving grant types is listed in Section 15 — Provisional Grant Types.
Core patterns can be inferred from the examples throughout this document.

---

# 7. States

## 7.1 States must be explicit

Use:

```json
{ "type": "state", "state_id": "rage" }
```

States are used for:

* transformations
* combat modes
* sustained buffs

Examples:

* Rage
* Wild Shape
* Innate Sorcery
* Elemental Attunement

## 7.2 State-linked mechanics use `while_state`

Do not place mechanics inside the state grant.

Use separate grants:

```json
{ "type": "damage_bonus", "value": 2, "while_state": "rage" }
```

## 7.3 State replacement

Some states replace another state rather than stack.

```json
{ "type": "state", "state_id": "starry_form", "replaces_state": "wild_shape" }
```

## 7.4 State-based choice reset

Some choices reset when a state is activated.

```json
{ "replace_on": "rage" }
```

---

# 8. Auras

## 8.1 Auras are passive spatial fields

Aura grants define:

* aura ID
* radius
* targets
* activation conditions

Example:

```json
{ "type": "aura", "aura_id": "aura_of_protection", "radius_feet": 10, "targets": "allies" }
```

## 8.2 Aura-linked mechanics use `while_aura`

Do not nest mechanics inside the aura grant.

Example:

```json
{ "type": "saving_throw_bonus", "value": "charisma_modifier", "targets": "allies", "while_aura": "aura_of_protection" }
```

## 8.3 Aura modification

Aura radius or behavior can be modified later.

```json
{ "type": "aura_modifier", "aura_id": "aura_of_protection", "radius_feet": 30 }
```

---

# 9. Resources

## 9.1 Resources live in progression

Examples:

```json
{
  "rage_uses": 3,
  "rage_damage": 2,
  "channel_divinity_uses": 2,
  "bardic_inspiration_die": "d8",
  "superiority_dice": { "count": 4, "die": "d8" }
}
```

## 9.2 Multiple features can share one resource

A resource in progression can be referenced by many features.

Example:

```json
{ "uses_resource": "channel_divinity_uses" }
```

## 9.3 Resource conversion

Some features convert one resource into another outcome.

Example use cases:

* spell slot → sorcery points
* spell slot → bardic inspiration use
* sneak attack dice → cunning strike effect
* wild shape use → spell effect

---

# 10. Recharge, Refresh, and Triggers

## 10.1 Recharge vs refresh

These are distinct.

### `recharge`

Time/state/event-based reset.
Examples:

* `short-rest`
* `long-rest`
* `per_state`
* `on_spell_cast`

### `feature_refresh`

Resource-based reset by paying a cost.

Example:

```json
{
  "type": "feature_refresh",
  "feature_id": "beguiling_defenses",
  "cost": { "resource": "pact_spell_slot", "amount": 1 }
}
```

## 10.2 Recharge types

Supported recharge categories:

### Rest-based

* `"short-rest"`
* `"long-rest"`

### State-based

```json
{ "recharge": "per_state", "state_id": "rage" }
```

Never encode state inside the recharge string.

### Event-based

Examples:

* `"on_spell_cast"`
* `"on_wild_surge"`
* `"on_initiative"`

## 10.3 Triggered effects

Triggered effects are distinct from recharge.

```json
{ "type": "triggered_effect", "trigger": "on_spell_cast" }
```

## 10.4 Triggered resource restore

Triggered restore must define:

* trigger
* resource
* amount or threshold behavior

Example:

```json
{ "type": "triggered_resource_restore", "resource": "spell_slots", "trigger": "cast_divination_spell", "amount": 1 }
```

### Conditional restore thresholds

```json
{ "type": "triggered_resource_restore", "resource": "bardic_inspiration_uses", "trigger": "on_initiative", "minimum": 2 }
```

`minimum` means: restore up to that threshold if current amount is below it.

---

# 11. Prerequisites

Prerequisites fall into three categories.

## 11.1 Soft prerequisites

Descriptive only. Not machine-validated.

Examples:

* requires Reckless Attack
* requires Primal Companion

## 11.2 Hard structural prerequisites

Machine-readable requirements.

Example:

```json
{
  "prerequisites": {
    "level": 5,
    "class_id": "warlock",
    "feature_ids": ["pact-of-the-blade"]
  }
}
```

## 11.3 Build-defining choice dependencies

Machine-readable requirements based on earlier choices.

Example:

```json
{
  "prerequisites": {
    "chosen_options": [
      { "choice_id": "warlock_pact", "option_id": "pact_blade" }
    ]
  }
}
```

Only hard structural prerequisites and build-defining choice dependencies must be modeled explicitly.

---

# 12. Spellcasting-Specific Systems

## 12.1 Subclass spell packages

Model subclass spell packages as `always_prepared_spell` grants with class-level thresholds.

No separate spell-list collection per subclass.

## 12.2 Spellbook

Wizard spellbook is a persistent collection system.

Schema definition:

```json
{ "type": "spellbook", "initial_spells": 6, "add_per_level": 2 }
```

Important distinction:

* schema defines how spellbook grows
* character data stores actual spell IDs

## 12.3 Temporary spell access

Some features temporarily grant access to a spell or stolen spell knowledge.

This is a valid provisional pattern.

---

# 13. Specialized Systems

## 13.1 Secondary HP pools

Example:

```json
{ "type": "secondary_hp_pool", "pool_id": "arcane_ward", "max_hp_from_resource": "arcane_ward_hp", "recharge": "long-rest" }
```

These must be tracked separately from normal HP.

## 13.2 Stored roll pools

Example:

```json
{ "type": "stored_roll_pool", "pool_id": "portent_rolls", "dice_count": 2, "die": "d20", "recharge": "long-rest", "usage": "replace_roll" }
```

These are neither resources nor states.

## 13.3 Stat override

Used for Wild Shape and similar mechanics.

Example:

```json
{
  "type": "stat_override",
  "replaces": ["strength", "dexterity", "constitution", "ac", "speed", "hp"],
  "retains": ["intelligence", "wisdom", "charisma", "proficiencies"],
  "source_entity": "beast"
}
```

## 13.4 Entity filtering

Used when entity selection is gated by simple conditions.

Example:

```json
{ "type": "entity_filter", "conditions": { "max_cr": "...", "allow_fly": false } }
```

---

# 14. Wild Magic Table

The Wild Magic Surge table is excluded from class conversion and should be referenced as a placeholder only.

Example:

```json
{ "table": "wild-magic-surge-table" }
```

---

# 15. Provisional Grant Types

These are valid but not yet fully standardized:

* `resource_conversion`
* `spell_cost_override`
* `spell_component_override`
* `damage_reduction_pool`
* `minimum_roll_override`
* `prevent_advantage_against_self`
* `spell_effect_transformation`
* `restriction`
* `restriction_override`
* `state_application`
* `spell_range_override`
* `temporary_spell_access`

Also note:

* `triggered_resource_restore` may include `minimum`
* costed choice options are valid
* cross-list spell access may use a spell-list-expansion style grant

---

# 16. Known Future Pressure Points

These are not blockers, but should be tracked:

* spell origin override
* layered states
* persistent buff durations like “until reused”
* aura stacking / duplicate aura resolution
* target-applied persistent states
* multiclass interactions
* spellbook storage in character data
* secondary HP pool UI tracking
* runtime distinction between recharge, refresh, triggered effects, and triggered restore

---

# 17. Conversion Completion Checklist

Before a class conversion is considered complete:

* resources appear on every level
* all 20 levels exist
* no scaling tables appear inside features
* every feature has `player_choice`
* all subclass features are included
* named channel divinity options or equivalents are separate features
* subclass spell packages use `always_prepared_spell`
* no formula strings exist
* no effects arrays exist
* slot progression uses shared tables where applicable
* pact magic is modeled separately
* all recharge conditions are explicit
* state-linked mechanics use `while_state`
* aura-linked mechanics use `while_aura`

---

If you want, I can turn this into a polished **SCHEMA.md file draft** next, or use it immediately as the reference to start the first full class conversion.
