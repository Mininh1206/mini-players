import type { Skill } from './types';
import { Specialization, Vehicle, Weapon, Shotgun, AssaultRifle, Handgun, SniperRifle, MachineGun, Launcher, Melee, Equipment, Other, Grenade } from './classes/Skill';

export const SKILLS: Skill[] = [
    // Specializations (Level 6)
    new Specialization('comms_officer', 'Comms Officer', 'Enables communication and tactical orders.', '📡', 0, 0),
    new Specialization('doctor', 'Doctor', 'Heals teammates and provides medical support.', '⚕️', 0, 0),
    new Specialization('pilot', 'Pilot', 'Expert in operating vehicles and aircraft.', '✈️', 0, 0),
    new Specialization('saboteur', 'Saboteur', 'Specializes in sabotage and disrupting enemy weapons.', '🧨', 0, 0),
    new Specialization('scout', 'Scout', 'High mobility and reconnaissance capabilities.', '🔭', 0, 0), // Deployment handled in logic
    new Specialization('soldier', 'Soldier', 'Balanced combatant with extra health.', '🪖', 0, 0), // HP/Level handled in logic
    new Specialization('sniper', 'Sniper', 'Deadly precision at long range.', '🎯', 0, 0),
    new Specialization('commando', 'Commando', 'Versatile warrior for any situation.', '⚔️', 0, 0), // Not in doc, kept neutral
    new Specialization('spy', 'Spy', 'Infiltrates enemy lines. High initiative.', '🕵️', 0, 10),

    // Vehicles (Level 7+)
    new Vehicle('motorcycle', 'Motorcycle', 'Fast transport. Uses 2 Deployment Points.', '🏍️', 7),
    new Vehicle('light_tank', 'Light Tank', 'Armored vehicle. Uses 6 Deployment Points.', '🚜', 7),
    new Vehicle('heavy_tank', 'Heavy Tank', 'Heavily armored. Uses 8 Deployment Points.', '🛡️', 7),
    new Vehicle('helicopter', 'Helicopter', 'Air support. Uses 4 Deployment Points.', '🚁', 7),
    new Vehicle('fighter_jet', 'Fighter Jet', 'Air superiority. Uses 10 Deployment Points.', '✈️', 7),

    // Weapons - Shotguns
    // Shotgun: Dam:5-8, Rng:4, Crit:10, Aim:150, Rec:150, Cap:1, Shots:4, Area:1, Stun:50
    new Shotgun('shotgun', 'Shotgun', 'Knocks enemy down, zone damage.', '🔫', 5, 1, 4, 10, 150, 150, 1, 1, 50, 0, 0, 8, 4),
    // Double: Dam:5-10, Bur:2, Rng:5, Crit:10, Aim:150, Rec:150, Cap:2, Shots:6
    new Shotgun('double_barrel', 'Double-Barrelled Shotgun', 'Fires two powerful shots.', '🔫', 5, 2, 5, 10, 150, 150, 2, 1, 50, 0, 0, 10, 6),
    // Pump: Dam:5-10, Rng:4, Crit:10, Aim:150, Rec:90, Cap:1, Shots:6
    new Shotgun('pump_action', 'Pump Action Shotgun', 'Reliable close-quarters weapon.', '🔫', 5, 1, 4, 10, 150, 90, 1, 1, 50, 0, 0, 10, 6),
    // Scatter: Dam:4-12, Rng:4, Crit:5, Aim:150, Rec:100, Cap:1, Shots:6, Area:2 (Extended)
    new Shotgun('scattergun', 'Scattergun', 'Wide spread damage.', '💥', 4, 1, 4, 5, 150, 100, 1, 2, 40, 0, 0, 12, 6),
    // Semi: Dam:5-10, Bur:2, Rng:4, Crit:10, Aim:150, Rec:70, Cap:4, Shots:8
    new Shotgun('semi_auto_shotgun', 'Semi-Auto Shotgun', 'Fast firing shotgun.', '🔫', 5, 2, 4, 10, 150, 70, 4, 1, 50, 0, 0, 10, 8),

    // Weapons - Assault
    // AR: Dam:2-3, Bur:3, Rng:6, Crit:5, Aim:80, Rec:100, Cap:9, Shots:18
    new AssaultRifle('assault_rifle', 'Assault Rifle', 'Standard issue versatile rifle.', '︻デ═一', 2, 3, 6, 5, 80, 100, 9, 0, 0, 3, 18),
    // AK47: Dam:2-3, Bur:4, Rng:7, Crit:10, Aim:100, Rec:100, Cap:12, Shots:16
    new AssaultRifle('ak47', 'AK47', 'High damage, reliable assault rifle.', '︻デ═一', 2, 4, 7, 10, 100, 100, 12, 0, 0, 3, 16),
    // FAMAS: Dam:3-4, Bur:3, Rng:5, Crit:10, Aim:90, Rec:50, Cap:9, Shots:18
    new AssaultRifle('famas', 'FAMAS', 'Burst fire assault rifle.', '︻デ═一', 3, 3, 5, 10, 90, 50, 9, 0, 0, 4, 18),
    // M16: Dam:2-3, Bur:3, Rng:6, Crit:10, Aim:80, Rec:80, Cap:12, Shots:18
    new AssaultRifle('m16', 'M16', 'Accurate assault rifle.', '︻デ═一', 2, 3, 6, 10, 80, 80, 12, 0, 0, 3, 18),
    // Thompson: Dam:3-7, Bur:3, Rng:6, Crit:10, Aim:80, Rec:80, Cap:9, Shots:18, Ignores Armor
    new AssaultRifle('thompson', 'Thompson', 'Classic submachine gun.', '︻デ═一', 3, 3, 6, 10, 80, 80, 9, 0, 0, 7, 18, true),
    // UMP: Dam:3-4, Bur:3, Rng:6, Crit:20, Aim:100, Rec:80, Cap:9, Shots:18
    new AssaultRifle('ump', 'UMP', 'Modern submachine gun.', '︻デ═一', 3, 3, 6, 20, 100, 80, 9, 0, 0, 4, 18),

    // Weapons - Handguns
    // Pistol: Dam:2-3, Rng:7, Crit:5, Aim:90, Rec:100, Cap:3, Shots:4
    new Handgun('pistol', 'Pistol', 'Standard sidearm.', '🔫', 2, 1, 7, 5, 90, 100, 3, 0, 0, 0, 3, 4),
    // Beretta: Dam:3-4, Rng:8, Crit:10, Aim:90, Rec:50, Cap:4, Shots:8
    new Handgun('beretta', 'Beretta', 'Reliable semi-auto pistol.', '🔫', 3, 1, 8, 10, 90, 50, 4, 0, 0, 0, 4, 8),
    // Eagle: Dam:4, Rng:10, Crit:10, Aim:100, Rec:100, Cap:4, Shots:8, Ignores Armor
    new Handgun('desert_eagle', 'Desert Eagle', 'High caliber pistol.', '🦅', 4, 1, 10, 10, 100, 100, 4, 0, 0, 0, 4, 8, true),
    // Dual: Dam:3-4, Bur:2, Rng:8, Crit:10, Aim:80, Rec:100, Cap:8, Shots:16
    new Handgun('dual_pistols', 'Dual Pistols', 'Double the firepower.', '🔫🔫', 3, 2, 8, 10, 80, 100, 8, 0, 0, 0, 4, 16),
    // Revolver: Dam:4-6, Rng:9, Crit:10, Aim:75, Rec:120, Cap:6, Shots:12, Knocks down (Stun 50)
    new Handgun('revolver', 'Revolver', 'High damage, slow reload.', '🤠', 4, 1, 9, 10, 75, 120, 6, 0, 50, 0, 6, 12),

    // Weapons - Rifles
    // Sniper: Dam:4, Rng:100, Crit:15, Aim:150, Rec:100, Cap:1, Shots:2
    new SniperRifle('sniper_rifle', 'Sniper Rifle', 'Long range precision weapon.', '🎯', 4, 1, 100, 15, 150, 100, 1, 2, 0, 4, 2),
    // CK: Dam:3, Rng:100, Crit:25, Aim:150, Rec:65, Cap:6, Shots:12, Heavy (Enc 20)
    new SniperRifle('ck_magellan', 'CK-Magellan', 'Advanced sniper rifle.', '🔭', 3, 1, 100, 25, 150, 65, 6, 20, 20, 5, 12),
    // Jungle: Dam:5, Rng:100, Crit:20, Aim:120, Rec:100, Cap:2, Shots:4, Heavy
    new SniperRifle('lizaro_jungle', 'Lizaro Jungle', 'Camouflaged sniper rifle.', '🌿', 5, 1, 100, 20, 120, 100, 2, 30, 20, 5, 4),
    // MOS: Dam:6-7, Rng:100, Crit:25, Aim:150, Rec:120, Cap:3, Shots:6, Heavy
    new SniperRifle('mos_teck', 'MOS-TECK', 'High tech sniper rifle.', '🦾', 6, 1, 100, 25, 150, 120, 3, 30, 20, 5, 6),
    // Sparrow: Dam:3, Rng:100, Crit:50, Aim:300, Rec:100, Cap:1, Shots:4, Heavy
    new SniperRifle('sparrowhawk', 'SparrowHawk', 'Lightweight sniper rifle.', '🦅', 3, 1, 100, 50, 300, 100, 1, 30, 20, 5, 4),
    
    // Weapons - Machine Guns
    // Comanche: Dam:3-4, Bur:6, Rng:6, Crit:5, Aim:90, Rec:60, Cap:18, Shots:36, Heavy
    new MachineGun('comanche_auto', 'Comanche Auto', 'Automatic heavy weapon.', '🚙', 3, 6, 6, 5, 90, 60, 18, 0, 20, 4, 36),
    // Gatling: Dam:3-6, Bur:5, Rng:7, Crit:5, Aim:70, Rec:110, Cap:20, Shots:40, Heavy
    new MachineGun('gatling_gun', 'Gatling Gun', 'Old school rapid fire.', '⚙️', 3, 5, 7, 5, 70, 110, 20, 0, 20, 6, 40),
    // HeavyMG: Dam:3-4, Bur:8, Rng:6, Crit:5, Aim:70, Rec:150, Cap:22, Shots:44, Heavy
    new MachineGun('heavy_machine_gun', 'Heavy Machine Gun', 'Stationary firepower.', '🏗️', 3, 8, 6, 5, 70, 150, 22, 0, 20, 4, 44),
    // Minigun: Dam:2-3, Bur:6, Rng:6, Crit:5, Aim:100, Rec:80, Cap:22, Shots:44, Heavy
    new MachineGun('minigun', 'Minigun', 'Rapid fire heavy weapon.', '⚙️', 2, 6, 6, 5, 100, 80, 22, 0, 20, 3, 44),
    
    // Weapons - Launchers
    // Bazooka: Dam:8-15, Rng:100, Crit:1, Aim:100, Rec:100, Cap:1, Shots:2, Heavy, Secure Zone (Min 30)
    new Launcher('bazooka', 'Bazooka M1', 'Standard bazooka.', '🚀', 8, 1, 100, 1, 100, 100, 1, 2, 50, 5, 20, 15, 2),
    // BazookaM25: Dam:6-12, Rng:100, Crit:1, Aim:80, Rec:120, Cap:3, Shots:6, Heavy
    new Launcher('bazooka_m25', 'Bazooka M25', 'Advanced bazooka.', '🚀', 6, 1, 100, 1, 80, 120, 3, 2, 50, 5, 20, 12, 6),
    // Infernal: Dam:14-28, Rng:100, Crit:1, Aim:95, Rec:150, Cap:1, Shots:1, Heavy
    new Launcher('infernal_tube', 'Infernal Tube', 'Fires incendiary rockets.', '🔥', 14, 1, 100, 1, 95, 150, 1, 2, 50, 5, 20, 28, 1),
    // Rocket: Dam:8-15, Rng:100, Crit:1, Aim:80, Rec:120, Cap:1, Shots:3
    new Launcher('rocket_launcher', 'Rocket Launcher', 'Rapid fire rockets.', '🚀', 8, 1, 100, 1, 80, 120, 1, 2, 50, 5, 0, 15, 3),

    // Weapons - Melee
    // Knife: Dam:2-4, Rng:1, Crit:10, Aim:120, Rec:40
    new Melee('knife', 'Knife', 'Close quarters combat.', '🔪', 2, 1, 1, 10, 120, 40, 999, 0, 0, 0, 4, 999),

    // Ammunition
    new Equipment('explosive_shells', 'Explosive Shells', 'Bullets explode on impact.', '💥', 99),
    new Equipment('hydroshock_shells', 'Hydroshock Shells', 'Increased damage vs soft targets.', '💧', 99),
    new Equipment('paralysing_shells', 'Paralysing Shells', 'Chance to paralyze target.', '⚡', 99),
    new Equipment('toxic_shells', 'Toxic Shells', 'Poison damage over time.', '☠️', 99),
    new Equipment('armor_piercing_shells', 'Armor-Piercing Shells', 'Ignores armor.', '🔩', 99),

    // Grenades
    // Grenades (Now Weapons for easier AI usage, with high Area, low Capacity)
    // Grenades (Now Weapons for easier AI usage, with high Area, low Capacity)
    // Grenades
    new Grenade('frag_grenade', 'Fragmentation Grenade', 'Explodes dealing area damage.', '💣', 1, 5, 1, 6, 3, 'fragmentation', 25),
    new Grenade('flashbang', 'Flashbang', 'Blinds enemies.', '✨', 0, 0, 2, 6, 3, 'flash'),
    new Grenade('gas_grenade', 'Gas Grenade', 'Poison cloud.', '☁️', 0, 0, 2, 6, 3, 'gas'),
    new Grenade('glue_grenade', 'Glue Grenade', 'Slows down enemies.', '🧴', 0, 0, 2, 6, 3, 'glue'),
    new Grenade('shock_grenade', 'Shock Grenade', 'Disarms enemies.', '⚡', 0, 0, 2, 6, 3, 'shock'),
    new Grenade('clown_grenade', 'Clown Grenade', 'Distracts enemies.', '🤡', 0, 0, 1, 6, 3, 'clown'),
    new Grenade('grenade_benie', 'Grenade Benie', 'Powerful explosion.', '🍀', 12, 24, 3, 6, 3, undefined, 10),
    new Grenade('healing_grenade', 'Healing Grenade', 'Heals allies.', '❤️', 0, 0, 3, 6, 3, 'healing'),
    // Black Hole: Max damage? Using 999.
    new Grenade('black_hole_grenade', 'Black Hole Grenade', 'Sucks enemies in.', '⚫', 999, 999, 2, 6, 1, 'black_hole'),

    // Other Skills (Passives & Active)
    new Other('zigzag', 'Zigzag', 'Harder to hit while moving.', '〰️'),
    new Other('rush', 'Rush', 'Move closer to enemy at start.', '⏩'),
    new Other('tuck_and_roll', 'Tuck and Roll', 'Reduces explosive damage.', '🤸'),
    new Other('load_carrier', 'Load Carrier', 'Carry more ammo.', '🎒'),
    new Other('propaganda', 'Propaganda', 'Convert enemies to your side.', '📢'),
    new Other('king_of_boules', 'King of Boules', 'Master of balls.', '🎱'),
    new Other('biped', 'Biped', 'Walks on two legs.', '🚶'),
    new Other('eye_of_the_tiger', 'Eye of the Tiger', 'Fierce determination.', '🐯'),
    new Other('heat_sensor', 'Heat Sensor', 'Detects enemies by heat.', '🌡️'),
    new Other('barrel_extension', 'Barrel Extension', 'Increases range.', '📏'),
    new Other('compensator', 'Compensator', 'Reduces recoil.', '⚖️'),
    new Other('heartbreaker', 'Heartbreaker', 'Breaks hearts and bones.', '💔'),
    new Other('covering_fire', 'Covering Fire', 'Suppressing fire.', '🛡️'),
    new Other('loader', 'Loader', 'Faster loading.', '📥'),
    new Other('unshakable', 'Unshakable', 'Cannot be moved.', '🗿'),
    new Other('on_point', 'On Point', 'Always ready.', '📍'),
    new Other('vendetta', 'Vendetta', 'Revenge is sweet.', '⚔️'),
    new Other('enthusiastic', 'Enthusiastic', 'Always happy to fight.', '😃'),
    new Other('thermos_of_coffee', 'Thermos of Coffee', 'Keeps you awake.', '☕'),
    new Other('tail_gunner', 'Tail Gunner', 'Watch your back.', '🔙'),
    new Other('nervous', 'Nervous', 'Jumpy but fast.', '😬'),
    new Other('stamp', 'Stamp', 'Crush enemies.', '🦶'),
    new Other('death_grip', 'Death Grip', 'Hold on tight.', '✊'),
    new Other('last_mohican', 'Last Mohican', 'Last one standing.', '🏹'),
    new Other('hyperactive', 'Hyperactive', 'Can\'t sit still.', '⚡'),
    new Other('amphetamine_shot', 'Amphetamine Shot', 'Temporary speed boost.', '💉'),
    new Other('wife_beater', 'Tank Top', 'Shows off muscles.', '🎽'),
    new Other('hurry', 'Hurry', 'Move faster.', '🏃'),
    new Other('bounce_back', 'Bounce Back', 'Recover quickly.', '🏀'),
    new Other('battle_ready', 'Battle Ready', 'Prepared for anything.', '⚔️'),
    new Other('rucksack', 'Rucksack', 'Carry more items.', '🎒'),
    new Other('restless', 'Restless', 'Cannot rest.', '👀'),
    new Other('martyr', 'Martyr', 'Sacrifice for the team.', '✝️'),
    new Other('binoculars', 'Binoculars', 'See further.', '👀'),
    new Other('radio', 'Radio', 'Call for support.', '📻'),
    new Other('talky_walky', 'Talky-Walky', 'Communicate with team.', '📞'),
    new Other('out_of_bounds', 'Out of Bounds', 'Go where you shouldn\'t.', '🚫'),
    new Other('reverse_attack', 'Reverse Attack', 'Counter attack.', '↩️'),
    new Other('commander', 'Commander', 'Lead the team.', '👨‍✈️'),
    new Other('occupation', 'Occupation', 'Hold ground.', '🚩'),
    new Other('saviour', 'Saviour', 'Save teammates.', '🦸'),
    new Other('scavenger', 'Scavenger', 'Find items.', '🗑️'),
    new Other('voodoo_doll', 'Voodoo Doll', 'Curse enemies.', '🎎'),
    new Other('full_metal_balaclava', 'Full Metal Balaclava', 'Head protection.', '🥷'),
    new Other('bulletproof_vest', 'Bulletproof Vest', 'Body protection.', '🦺'),
    new Other('heavy_armor', 'Heavy Armor', 'Maximum protection.', '🛡️'),
    new Other('hard_boiled', 'Hard Boiled', 'Tough as nails.', '🥚'),
    new Other('lucky_charm', 'Lucky Charm', 'Increases luck.', '🍀'),
    new Other('dodger', 'Dodger', 'Expert at dodging.', '💨'),
    new Other('take_cover', 'Take Cover!', 'Find cover quickly.', '🧱'),
    new Other('camouflage', 'Camouflage', 'Blend in.', '🍃'),
    new Other('huge_calves', 'Huge Calves', 'Strong legs.', '🦵'),
    new Other('sturdy', 'Sturdy', 'Hard to knock down.', '🧱'),
    new Other('brick_shithouse', 'Brick Wall', 'Immovable object.', '🧱'),
    new Other('heavyweight', 'Heavyweight', 'Hard to lift.', '🏋️'),
    new Other('fall_guy', 'Fall Guy', 'Takes the fall.', '🤸'),
    new Other('invincible', 'Invincible', 'Cannot be hurt.', '🌟'),
    new Other('suspicious', 'Suspicious', 'Trust no one.', '🤨'),
    new Other('friendly_fire', 'Friendly Fire', 'Watch your fire.', '⚠️'),
    new Other('crybaby', 'Crybaby', 'Cries when hit.', '😭'),
    new Other('interception', 'Interception', 'Intercept attacks.', '✋'),
    new Other('survivor', 'Survivor', 'Survive against odds.', '🏝️'),
    new Other('first_aid', 'First Aid', 'Basic healing.', '🩹'),
    new Other('unforgiving', 'Unforgiving', 'No mercy.', '😈'),
    new Other('faceboot', 'Faceboot', 'Kick in the face.', '🥾'),
    new Other('fists_of_fury', 'Fists of Fury', 'Punch flurry.', '👊'),
    new Other('wrestler', 'Wrestler', 'Grapple enemies.', '🤼'),
    new Other('charge', 'Charge', 'Run at enemies.', '🐂'),
    new Other('smart', 'Smart', 'Intelligent tactics.', '🧠'),
    new Other('bait', 'Bait', 'Lure enemies.', '🪝'),
    new Other('pink_grenade', 'Pink Grenade', 'Fabulous explosion.', '🌸'),
    new Other('laser_sights', 'Laser Sights', 'Improved aim.', '🔴'),
    new Other('cold_blooded', 'Cold Blooded', 'Steady aim.', '❄️'),
    new Other('vicious', 'Vicious', 'Cruel attacks.', '🧛'),
    new Other('anatomy', 'Anatomy', 'Knows weak points.', '🦴'),
    new Other('blind_fury', 'Blind Fury', 'Attack wildly.', '😡'),
    new Other('nimble_fingers', 'Nimble Fingers', 'Fast reload.', '👐'),
    new Other('juggler', 'Juggler', 'Switch weapons fast.', '🤹'),
    new Other('twinoid', 'Twinoid', 'Double dose.', '💊'),
    new Other('frenetic', 'Frenetic', 'Fast attacks.', '🌪️'),
    new Other('sprinter', 'Sprinter', 'Run fast.', '🏃'),
    new Other('survival_instinct', 'Survival Instinct', 'Dodge when low HP.', '🆘'),
    new Other('adrenaline', 'Adrenaline', 'Boost when hit.', '💉'),
    new Other('trigger_happy', 'Trigger Happy', 'Shoot more.', '🔫')
];

export const getRandomSkill = (excludeSkills: Skill[] = [], minLevel: number = 1, maxLevel: number = 100, excludeSpecs: boolean = false): Skill => {
    const available = SKILLS.filter(s => 
        !excludeSkills.some(e => e.id === s.id) &&
        (s.level || 1) >= minLevel &&
        (s.level || 1) <= maxLevel &&
        (!excludeSpecs || !(s instanceof Specialization))
    );
    if (available.length === 0) return SKILLS[0];
    return available[Math.floor(Math.random() * available.length)];
};

export const getSkillsByLevel = (level: number): Skill[] => {
    return SKILLS.filter(s => (s.level || 1) === level);
};

export const getDefaultWeapons = (): Weapon[] => {
    return SKILLS.filter(s => ['pistol', 'shotgun', 'assault_rifle', 'sniper_rifle'].includes(s.id)) as Weapon[];
};
