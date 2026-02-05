import React from 'react';

export const AssetPath = {
    // --- WEAPONS (Improved paths with better shapes) ---
    Pistol: "M4 8h6l2-2h3v4l-1 1v2h-2v-2h-2l-1 1h-5z",
    Revolver: "M3 8h4l1-2h5v3l-1 1h-1v2l-1 1h-2v-3h-1l-1 1h-3z M14 7a1 1 0 1 0 0 2",
    Rifle: "M1 10h14l2-3h5v5h-5l-2-2h-14z M6 12v2 M12 12v2",
    Sniper: "M0 10h16l2-3h4v5h-4l-2-2h-16z M10 5v3 M15 5v3 M3 12v2",
    Shotgun: "M2 9h11l2-3h5v6h-5l-2-3h-11z M4 12v2 M8 12v2",
    Minigun: "M2 8h6v5h-6z M8 6h10v9h-10z M18 9h4v3h-4z M8 8h2 M8 11h2",
    Knife: "M12 4l-8 8l2 2l8-8z M14 4l4 4 M3 15l3-1",
    Grenade: "M12 5a7 7 0 1 1-7 7a7 7 0 0 1 7-7z M12 5v-3 M10 2h4 M14 4l2-2",
    RocketLauncher: "M1 7h12l3-4h6v10h-6l-3-4h-12z M5 15v3 M12 15v3",

    // --- HELMETS (CLASSES) ---
    HelmetSoldier: "M4 8a8 8 0 0 1 16 0v5h-16z M3 13h18v2h-18z",
    HelmetMedic: "M4 8a8 8 0 0 1 16 0v5h-16z M11 6v6 M8 9h6",
    HelmetPilot: "M4 8a8 8 0 0 1 16 0v3h-16z M5 11h14v5h-14z M8 13h8",
    HelmetScout: "M5 10a7 7 0 0 1 14 0v3h-14z M9 4h6l1 3h-8z",
    HelmetSniper: "M4 8a8 8 0 0 1 16 0v5h-16z M19 4l3-3 M21 5l1 1",
    HelmetCommando: "M4 7a8 8 0 0 1 16 0v6h-16z M2 11h20v2h-20z",
    HelmetSpy: "M3 5h18v5h-18z M1 10h22v3h-22z",
    HelmetSaboteur: "M4 8a8 8 0 0 1 16 0v5h-16z M18 13l4-4 M20 15l2-2",
    HelmetComms: "M4 8a8 8 0 0 1 16 0v5h-16z M20 3v8 M18 5v4",
    HelmetRat: "M3 14c2-3 5-5 9-5s7 2 9 5v5h-18z M4 9l-3-5 M20 9l3-5",

    // --- SKILLS / STATUS ICONS ---
    Heart: "M12 21l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.2L12 21z",
    Muscle: "M5 12l4-8l4 4l-2 4h6l4 4l-4 4l-4-4l2-4h-6l-4-4z",
    Boot: "M6 20l2-6 4-2 2 2h4l2-4-2-6h-6l-2 4-4 2-2 6z",
    Lightning: "M13 2L4 14h7l-2 8l9-12h-7l2-8z",
    Eye: "M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    Crosshair: "M12 2v4 M12 18v4 M2 12h4 M18 12h4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    Shield: "M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z M12 22V2",
    Vest: "M12 3L6 6v8c0 4 2 7 6 8 4-1 6-4 6-8V6l-6-3z M12 3v18 M6 9h12",
    FirstAid: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z",
    WalkieTalkie: "M7 2h10v18H7z M9 4h6v5H9z M12 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M6 2l-2-1 M18 2l2-1",
    Explosion: "M12 2l2 5h5l-4 3l2 5l-5-3l-5 3l2-5l-4-3h5z M12 12l1 3h3l-2 2l1 3l-3-2l-3 2l1-3l-2-2h3z",
    Magnet: "M4 7v6c0 5.5 4 9 8 9s8-3.5 8-9V7h-4v6c0 2.5-2 5-4 5s-4-2.5-4-5V7H4z M4 7v-3h4v3 M16 7v-3h4v3",
    Fist: "M6 12c0-2 2-4 5-4h2v-3c0-1 1-2 2-2s2 1 2 2v6h2c1 0 2 1 2 2v4c0 2-2 4-5 4h-5c-3 0-5-2-5-5v-4z",
    Tank: "M2 14h20v4H2z M4 12h16v2H4z M6 10h12a2 2 0 0 1 2 2H4a2 2 0 0 1 2-2z M16 8l4-4v4z",

    // Body Parts / Status
    Silhouette: "M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 10c-5 0-8 3-8 8v4h6v-5h4v5h6v-4c0-5-3-8-8-8z",
    Skull: "M12 2a8 8 0 0 0-8 8v4h3v2h2v-2h6v2h2v-2h3v-4a8 8 0 0 0-8-8z M8 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M16 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M10 17h4v2h-4z",

    // Equipment
    Backpack: "M7 8V6a5 5 0 0 1 10 0v2h1c1 0 2 1 2 2v10c0 1-1 2-2 2H6c-1 0-2-1-2-2V10c0-1 1-2 2-2h1z M9 6a3 3 0 0 1 6 0v2H9V6z",
    Ammo: "M4 6h16v12H4z M7 6V4h2v2 M11 6V4h2v2 M15 6V4h2v2 M7 18v2 M12 18v2 M17 18v2",
    Star: "M12 2l3 6h6l-5 4l2 6l-6-4l-6 4l2-6l-5-4h6z",
};

export const SvgIcon = ({ path, color = "currentColor", size = 24, className = "", stroke = false }: { path: string, color?: string, size?: number, className?: string, stroke?: boolean }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={stroke ? "none" : color}
        stroke={stroke ? color : "none"}
        strokeWidth={stroke ? 1.5 : 0}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d={path} />
    </svg>
);

export const GetTrooperClassIcon = (className: string, size = 24, color = "currentColor") => {
    let path = AssetPath.HelmetSoldier;
    switch (className) {
        case 'Doctor': path = AssetPath.HelmetMedic; break;
        case 'Pilot': path = AssetPath.HelmetPilot; break;
        case 'Sniper': path = AssetPath.HelmetSniper; break;
        case 'Commando': path = AssetPath.HelmetCommando; break;
        case 'Scout': path = AssetPath.HelmetScout; break;
        case 'Spy': path = AssetPath.HelmetSpy; break;
        case 'Saboteur': path = AssetPath.HelmetSaboteur; break;
        case 'Comms Officer': path = AssetPath.HelmetComms; break;
        case 'Rat': path = AssetPath.HelmetRat; break;
    }
    return <SvgIcon path={path} size={size} color={color} />;
};

export const GetSkillIcon = (id: string, size = 24, color = "currentColor") => {
    // Weapons
    if (id.includes('pistol') || id.includes('beretta') || id.includes('eagle') || id.includes('dual')) return <SvgIcon path={AssetPath.Pistol} size={size} color={color} />;
    if (id.includes('revolver')) return <SvgIcon path={AssetPath.Revolver} size={size} color={color} />;
    if (id.includes('sniper') || id.includes('sparrow') || id.includes('magellan') || id.includes('jungle') || id.includes('mos')) return <SvgIcon path={AssetPath.Sniper} size={size} color={color} />;
    if (id.includes('shotgun') || id.includes('scatter') || id.includes('pump') || id.includes('double_barrel')) return <SvgIcon path={AssetPath.Shotgun} size={size} color={color} />;
    if (id.includes('rifle') || id.includes('m16') || id.includes('ak47') || id.includes('famas') || id.includes('thompson') || id.includes('ump')) return <SvgIcon path={AssetPath.Rifle} size={size} color={color} />;
    if (id.includes('machinegun') || id.includes('minigun') || id.includes('gatling') || id.includes('comanche') || id.includes('heavy_machine')) return <SvgIcon path={AssetPath.Minigun} size={size} color={color} />;
    if (id.includes('knife') || id.includes('sword')) return <SvgIcon path={AssetPath.Knife} size={size} color={color} />;
    if (id === 'fists' || id.includes('fist')) return <SvgIcon path={AssetPath.Fist} size={size} color={color} />;
    if (id.includes('grenade') || id.includes('flashbang') || id.includes('gas') || id.includes('glue') || id.includes('shock')) return <SvgIcon path={AssetPath.Grenade} size={size} color={color} />;
    if (id.includes('rocket') || id.includes('bazooka') || id.includes('infernal')) return <SvgIcon path={AssetPath.RocketLauncher} size={size} color={color} />;

    // Equipment / Armor
    if (id.includes('bulletproof') || id.includes('vest') || id.includes('armor') || id.includes('protection') || id.includes('heavy_armor')) return <SvgIcon path={AssetPath.Vest} size={size} color={color} />;
    if (id.includes('shell') || id.includes('ammo') || id.includes('munition')) return <SvgIcon path={AssetPath.Ammo} size={size} color={color} />;
    if (id.includes('rucksack') || id.includes('backpack') || id.includes('load') || id.includes('carrier')) return <SvgIcon path={AssetPath.Backpack} size={size} color={color} />;

    // Skills
    if (id.includes('heart') || id === 'anatomy' || id === 'survival' || id.includes('survivor')) return <SvgIcon path={AssetPath.Heart} size={size} color={color} />;
    if (id.includes('muscle') || id === 'load_bearer' || id.includes('strong') || id.includes('heavyweight')) return <SvgIcon path={AssetPath.Muscle} size={size} color={color} />;
    if (id.includes('sprint') || id === 'dash' || id.includes('speed') || id.includes('hurry') || id.includes('hyperactive') || id.includes('rush')) return <SvgIcon path={AssetPath.Lightning} size={size} color={color} />;
    if (id.includes('scope') || id.includes('eye') || id === 'vision' || id.includes('binocular') || id.includes('sensor')) return <SvgIcon path={AssetPath.Eye} size={size} color={color} />;
    if (id.includes('aim') || id === 'sniper_training' || id.includes('crosshair') || id.includes('laser')) return <SvgIcon path={AssetPath.Crosshair} size={size} color={color} />;
    if (id.includes('shield') || id.includes('cover') || id.includes('sturdy') || id.includes('brick')) return <SvgIcon path={AssetPath.Shield} size={size} color={color} />;
    if (id.includes('medic') || id === 'first_aid' || id.includes('heal') || id.includes('doctor')) return <SvgIcon path={AssetPath.FirstAid} size={size} color={color} />;
    if (id.includes('radio') || id === 'comms' || id.includes('talky') || id.includes('walkie') || id.includes('commander')) return <SvgIcon path={AssetPath.WalkieTalkie} size={size} color={color} />;
    if (id.includes('explosive') || id === 'sabotage' || id.includes('saboteur')) return <SvgIcon path={AssetPath.Explosion} size={size} color={color} />;
    if (id.includes('magnet') || id === 'scavenger') return <SvgIcon path={AssetPath.Magnet} size={size} color={color} />;

    // Vehicles
    if (id.includes('tank') || id.includes('vehicle')) return <SvgIcon path={AssetPath.Tank} size={size} color={color} />;

    // Special skills
    if (id.includes('star') || id.includes('lucky') || id.includes('charm')) return <SvgIcon path={AssetPath.Star} size={size} color={color} />;
    if (id.includes('skull') || id.includes('death') || id.includes('martyr')) return <SvgIcon path={AssetPath.Skull} size={size} color={color} />;

    // Default fallback
    return <SvgIcon path={AssetPath.HelmetSoldier} size={size} color={color} />;
};

export const GetWeaponIcon = GetSkillIcon;
