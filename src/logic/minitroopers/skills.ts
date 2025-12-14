import type { Skill } from './types';
import { Specialization, Vehicle, Weapon, Equipment, Other } from './classes/Skill';

export const SKILLS: Skill[] = [
    // Specializations (Level 6)
    new Specialization('comms_officer', 'Comms Officer', 'Enables communication and tactical orders.', '📡', 0, 0),
    new Specialization('doctor', 'Doctor', 'Heals teammates and provides medical support.', '⚕️', 5, 0),
    new Specialization('pilot', 'Pilot', 'Expert in operating vehicles and aircraft.', '✈️', 0, 0),
    new Specialization('saboteur', 'Saboteur', 'Specializes in sabotage and disrupting enemy weapons.', '🧨', 0, 0),
    new Specialization('scout', 'Scout', 'High mobility and reconnaissance capabilities.', '🔭', 0, 20),
    new Specialization('soldier', 'Soldier', 'Balanced combatant with extra health.', '🪖', 20, 0),
    new Specialization('sniper', 'Sniper', 'Deadly precision at long range.', '🎯', 0, 0),
    new Specialization('commando', 'Commando', 'Versatile warrior for any situation.', '⚔️', 10, 0),
    new Specialization('spy', 'Spy', 'Infiltrates enemy lines. High initiative.', '🕵️', 0, 50),

    // Vehicles (Level 7+)
    new Vehicle('motorcycle', 'Motorcycle', 'Fast transport. Uses 2 Deployment Points.', '🏍️', 7),
    new Vehicle('light_tank', 'Light Tank', 'Armored vehicle. Uses 6 Deployment Points.', '🚜', 7),
    new Vehicle('heavy_tank', 'Heavy Tank', 'Heavily armored. Uses 8 Deployment Points.', '🛡️', 7),
    new Vehicle('helicopter', 'Helicopter', 'Air support. Uses 4 Deployment Points.', '🚁', 7),
    new Vehicle('fighter_jet', 'Fighter Jet', 'Air superiority. Uses 10 Deployment Points.', '✈️', 7),

    // Weapons - Shotguns
    new Weapon('shotgun', 'Shotgun', 'High damage at close range.', '🔫', 10, 1, 2, 10, 80, 100, 2),
    new Weapon('double_barrel', 'Double-Barrelled Shotgun', 'Fires two powerful shots.', '🔫', 12, 2, 2, 15, 75, 150, 2),
    new Weapon('pump_action', 'Pump Action Shotgun', 'Reliable close-quarters weapon.', '🔫', 10, 1, 3, 10, 85, 90, 4),
    new Weapon('scattergun', 'Scattergun', 'Wide spread damage.', '💥', 8, 3, 2, 5, 70, 120, 3, 60),
    new Weapon('semi_auto_shotgun', 'Semi-Auto Shotgun', 'Fast firing shotgun.', '🔫', 9, 2, 3, 5, 75, 80, 6),

    // Weapons - Assault
    new Weapon('assault_rifle', 'Assault Rifle', 'Standard issue versatile rifle.', '︻デ═一', 6, 3, 5, 5, 90, 80, 30),
    new Weapon('ak47', 'AK47', 'High damage, reliable assault rifle.', '︻デ═一', 8, 3, 5, 10, 85, 90, 30),
    new Weapon('famas', 'FAMAS', 'Burst fire assault rifle.', '︻デ═一', 5, 5, 5, 5, 95, 70, 25),
    new Weapon('m16', 'M16', 'Accurate assault rifle.', '︻デ═一', 6, 3, 6, 10, 95, 80, 30),
    new Weapon('thompson', 'Thompson', 'Classic submachine gun.', '︻デ═一', 5, 5, 4, 5, 80, 60, 50),
    new Weapon('ump', 'UMP', 'Modern submachine gun.', '︻デ═一', 6, 4, 4, 5, 90, 70, 25),

    // Weapons - Handguns
    new Weapon('pistol', 'Pistol', 'Standard sidearm.', '🔫', 5, 1, 4, 5, 90, 50, 12),
    new Weapon('beretta', 'Beretta', 'Reliable semi-auto pistol.', '🔫', 4, 2, 4, 5, 95, 40, 15),
    new Weapon('desert_eagle', 'Desert Eagle', 'High caliber pistol.', '🦅', 12, 1, 5, 20, 80, 100, 7),
    new Weapon('dual_pistols', 'Dual Pistols', 'Double the firepower.', '🔫🔫', 5, 2, 4, 5, 85, 60, 24),
    new Weapon('revolver', 'Revolver', 'High damage, slow reload.', '🤠', 10, 1, 5, 15, 90, 120, 6),

    // Weapons - Rifles
    new Weapon('sniper_rifle', 'Sniper Rifle', 'Long range precision weapon.', '🎯', 15, 1, 10, 25, 100, 150, 5),
    new Weapon('ck_magellan', 'CK-Magellan', 'Advanced sniper rifle.', '🔭', 18, 1, 12, 30, 100, 160, 5),
    new Weapon('lizaro_jungle', 'Lizaro Jungle', 'Camouflaged sniper rifle.', '🌿', 16, 1, 11, 25, 100, 140, 5),
    new Weapon('mos_teck', 'MOS-TECK', 'High tech sniper rifle.', '🦾', 20, 1, 13, 35, 100, 180, 4),
    new Weapon('sparrowhawk', 'SparrowHawk', 'Lightweight sniper rifle.', '🦅', 14, 1, 10, 20, 100, 130, 6),

    // Weapons - Heavy & Machine Guns
    new Weapon('minigun', 'Minigun', 'Rapid fire heavy weapon.', '⚙️', 4, 10, 6, 5, 60, 150, 100),
    new Weapon('gatling_gun', 'Gatling Gun', 'Old school rapid fire.', '⚙️', 5, 8, 6, 5, 65, 180, 80),
    new Weapon('comanche_auto', 'Comanche Auto', 'Automatic heavy weapon.', '🚙', 6, 6, 5, 5, 70, 160, 60),
    new Weapon('heavy_machine_gun', 'Heavy Machine Gun', 'Stationary firepower.', '🏗️', 8, 5, 7, 5, 60, 180, 50),

    // Weapons - Launchers
    new Weapon('bazooka', 'Bazooka', 'Explosive anti-tank weapon.', '🚀', 30, 1, 8, 10, 70, 150, 1, 150, 40),
    new Weapon('bazooka_m1', 'Bazooka M1', 'Standard bazooka.', '🚀', 25, 1, 8, 10, 75, 140, 2, 120, 30),
    new Weapon('bazooka_m25', 'Bazooka M25', 'Advanced bazooka.', '🚀', 35, 1, 9, 15, 80, 160, 1, 180, 50),
    new Weapon('infernal_tube', 'Infernal Tube', 'Fires incendiary rockets.', '🔥', 20, 1, 7, 5, 70, 200, 3, 150),
    new Weapon('rocket_launcher', 'Rocket Launcher', 'Rapid fire rockets.', '🚀', 15, 2, 8, 5, 65, 180, 4, 100, 20),

    // Weapons - Melee
    new Weapon('knife', 'Knife', 'Close quarters combat.', '🔪', 5, 1, 1, 20, 100, 20, 999),

    // Ammunition
    new Equipment('explosive_shells', 'Explosive Shells', 'Bullets explode on impact.', '💥', 99),
    new Equipment('hydroshock_shells', 'Hydroshock Shells', 'Increased damage vs soft targets.', '💧', 99),
    new Equipment('paralysing_shells', 'Paralysing Shells', 'Chance to paralyze target.', '⚡', 99),
    new Equipment('toxic_shells', 'Toxic Shells', 'Poison damage over time.', '☠️', 99),
    new Equipment('armor_piercing_shells', 'Armor-Piercing Shells', 'Ignores armor.', '🔩', 99),

    // Grenades
    // Grenades (Now Weapons for easier AI usage, with high Area, low Capacity)
    // Grenades (Now Weapons for easier AI usage, with high Area, low Capacity)
    new Weapon('frag_grenade', 'Frag Grenade', 'Explodes dealing area damage.', '💣', 20, 1, 6, 5, 70, 0, 3, 140, 30),
    new Weapon('flashbang', 'Flashbang', 'Blinds enemies, reducing aim.', '✨', 5, 1, 5, 0, 80, 0, 3, 160, 60),
    new Weapon('gas_grenade', 'Gas Grenade', 'Poison cloud area.', '☁️', 10, 1, 5, 0, 80, 0, 3, 150),
    new Weapon('glue_grenade', 'Glue Grenade', 'Slows down enemies.', '🧴', 5, 1, 5, 0, 80, 0, 3, 150),
    new Weapon('shock_grenade', 'Shock Grenade', 'Stuns enemies.', '⚡', 15, 1, 5, 0, 80, 0, 3, 120, 100),
    new Weapon('clown_grenade', 'Clown Grenade', 'Distracts enemies.', '🤡', 10, 1, 5, 0, 80, 0, 3, 120, 20),
    new Weapon('grenade_benie', 'Grenade Benie', 'Lucky grenade.', '🍀', 25, 1, 5, 10, 90, 0, 3, 130),
    new Weapon('healing_grenade', 'Healing Grenade', 'Heals allies in area.', '❤️', 0, 1, 5, 0, 100, 0, 3, 150),
    new Weapon('black_hole_grenade', 'Black Hole Grenade', 'Sucks enemies in.', '⚫', 50, 1, 5, 0, 80, 0, 1, 200, 150),

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

export const getRandomSkill = (excludeSkills: Skill[] = [], minLevel: number = 1, maxLevel: number = 100): Skill => {
    const available = SKILLS.filter(s => 
        !excludeSkills.some(e => e.id === s.id) &&
        (s.level || 1) >= minLevel &&
        (s.level || 1) <= maxLevel
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
