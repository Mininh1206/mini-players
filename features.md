# Logic Features Implemented

## Combat Logic (`src/logic/minitroopers/combat.ts`)

- [x] **Power Calculation**: `calculateTrooperPower`, `calculateSquadPower` based on stats and skills.
- [x] **Battle Simulation**: `simulateBattle` main loop.
  - [x] Deployment System (Waves, Limits, Costs).
  - [x] Initiative/Action Timer System.
  - [x] Targeting AI (Closest, Weakest, Strongest, Random).
  - [x] Movement & Positioning.
  - [x] Retreat Logic (with Map Boundary Clamping).
  - [x] Weapon Selection AI (Ranges, Ammo, Safety, Favorites).
  - [x] Reloading Logic.
  - [x] Melee Combat (Fists).
  - [x] Burst Fire Handling.
  - [x] Hit Location System (`getHitLocation`).
  - [x] Wound System (`applyWound`).
- [x] **Weapon Resolution**: `resolveWeaponShot`.
  - [x] Accuracy/Miss Calculation.
  - [x] Damage Calculation (Armor mitigation).
  - [x] Critical Hits.
  - [x] Dodge Mechanics.

## Skills & Systems (`src/logic/minitroopers/systems/SkillSystem.ts`)

- [x] **Skill Manager**: Registry for all skill implementations.
- [x] **Hooks**:
  - [x] `modifyStats` (Passive stat boosts).
  - [x] `onBattleStart` (Vehicles, Sabotage, Comms).
  - [x] `onDeploy` (Spy infiltration).
  - [x] `onTurnStart` (Doctor Heal, Munitioner).
  - [x] `onTurnAction` (Grenades).
  - [x] `onTurnEnd` (Trigger Happy).
  - [x] `onBeforeAttack` (Survival Instinct, Armor Piercing).
  - [x] `onHit` (Explosive/Status Shells).
  - [x] `onDamageTaken` (Adrenaline, Reverse Attack, Crybaby, Survivor).

## Data & Definitions (`src/logic/minitroopers/skills.ts`)

- [x] **Weapons**: Full definitions (Snipers, Rifles, Pistols, MGs, Launchers, Shotguns).
- [x] **Specializations**: All 7 classes.
- [x] **Equipment**: Shells and Grenades.
- [x] **Passives**: ~40 passive skills defined.

## Testing (`src/logic/minitroopers/combat.test.ts`)

- [x] **Sniper Logic**: Validated RangeMin prevents infinite retreat.
- [x] **Boundaries**: Validated units stay on map.
