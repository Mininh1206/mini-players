import React from 'react';

export const AssetPath = {
    // --- WEAPONS (High Detail) ---
    Pistol: "M5 8c0-1.1.9-2 2-2h4l1-1h2l1 1h3v4l-1 1v2h-1.5l-.5 4c-.3 1.5-1.5 2-3 2-1 0-2-.5-2-1.5l1-4.5H8v-2H6c-1.1 0-2-.9-2-2V8z",
    Revolver: "M4 8h3l1-2h6l2 2v3l-1 1h-1v2c0 1.5-1 3-2.5 3S9 15.5 9 14v-2H7c-1 0-2-.5-2-1.5L4 8z M15 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    Rifle: "M2 12c0-.5.4-1 1-1h1l2-3h6l1 1h4l2 1v3h-2l-1 2h-4v-1h-6l-1 1H3c-1 0-1.5-.5-1-1v-1zm5 1h6v-2H7v2z",
    Sniper: "M2 11h2l2-3h7l1 1h5v3h-3l-1 2h-4l-1 3h-1l.5-3H8l-2 2H2v-5zm9-6h4v1h-4V5zm-8 7h2v2H3v-2z",
    Shotgun: "M2 10h3l2-2h8l1 1h3v4h-3l-1-1H7l-1 2H2v-4zm5 1h6v-2H7v2z",
    Minigun: "M4 9h4V7h6v2h4v6h-4v2H8v-2H4V9zm8-1h2v8h-2V8zm-2 1h-2v6h2V9zm6 0h-2v6h2V9z",
    Knife: "M16 3l3 3-9 9-3-3 9-9z M14 5l2 2-8 8H6v-2l8-8z M5 16l3 3",
    Grenade: "M12 4c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0-2v2m-3.5-.5L10 5m7-1.5L14 5",
    RocketLauncher: "M2 8h2l2-3h10l2 3h4v8h-4l-2 3H6l-2-3H2V8zm6 3h8v2H8v-2z",

    // --- HELMETS (CLASSES) ---
    HelmetSoldier: "M4 8a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z M3 13h18v2h-18z",
    HelmetMedic: "M4 8a8 8 0 0 1 16 0v5h-16z M12 5v4 M10 7h4",
    HelmetPilot: "M4 8a8 8 0 0 1 16 0v3h-16z M5 11h14v5c0 1-1 2-2 2H7c-1 0-2-1-2-2v-5z M8 13h8",
    HelmetScout: "M5 10a7 7 0 0 1 14 0v3h-14z M9 4h6l1 3h-8z M19 11v2 M5 11v2",
    HelmetSniper: "M4 8a8 8 0 0 1 16 0v5h-16z M19 4l3-3 M21 5l1 1 M12 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    HelmetCommando: "M4 7a8 8 0 0 1 16 0v6h-16z M2 11h20v2h-20z M6 6h12",
    HelmetSpy: "M3 5h18v5h-18z M1 10h22v3h-22z M12 5v-2",
    HelmetSaboteur: "M4 8a8 8 0 0 1 16 0v5h-16z M18 13l4-4 M20 15l2-2 M12 6l-3-3 M12 6l3-3",
    HelmetComms: "M4 8a8 8 0 0 1 16 0v5h-16z M20 3v8 M18 5v4 M20 3a2 2 0 1 1 0-4",
    HelmetRat: "M3 14c2-3 5-5 9-5s7 2 9 5v5h-18z M4 9l-3-5 M20 9l3-5 M8 14h8",

    // --- SKILLS / STATUS ICONS ---
    Heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    Muscle: "M6 11c0-2 .5-3 2-4h2c2 0 3 1 3 3v2h-2v-2c0-1-.5-1-1-1H9c-.5 0-1 .5-1 1v4h4v2H6v-5zm6 7c0 2 1 3 3 3h2c2 0 3-1 3-3v-4h-2v4c0 1-.5 1-1 1h-1c-.5 0-1-.5-1-1v-2h-4v2z",
    Boot: "M5 20h4l2-5 3-2 3 2h2v-4l-3-4-2-5H8l-3 6-2 3v9z M7 18v2h-2v-2h2z",
    Lightning: "M13 2L4 14h7l-2 8l9-12h-7l2-8z",
    Eye: "M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    Crosshair: "M12 2v4 M12 18v4 M2 12h4 M18 12h4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11v2 M11 12h2",
    Shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z M12 22C7.6 20.9 4 16.2 4 11V6l8-3.5L20 6v5c0 5.2-3.6 9.9-8 11z",
    Vest: "M12 2L4 5v10c0 4 3 7 8 8s8-4 8-8V5l-8-3zm0 2l6 2.2V15c0 3-2.2 5.8-6 6.8-3.8-1-6-3.8-6-6.8V6.2L12 4z",
    FirstAid: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z",
    WalkieTalkie: "M6 2h12v18H6V2zm2 2v2h2V4H8zm4 0v2h2V4h-2zm-6 4h12v10H6V8zm3 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    Explosion: "M12 2l2.5 5h5.5l-4.5 3.5L17 15l-5-3.5L7 15l1.5-4.5L4 7h5.5L12 2zm0 10l1.5 2.5h2.5l-2 1.5 1 2.5-2.5-1.5-2.5 1.5 1-2.5-2-1.5h2.5L12 12z",
    Magnet: "M6 8v6c0 3 2.5 6 6 6s6-3 6-6V8h-3v6c0 1.5-1.5 3-3 3s-3-1.5-3-3V8H6z M15 3h3v3h-3z M6 3h3v3H6z",
    Fist: "M5 11h2v-2c0-1.1.9-2 2-2s2 .9 2 2v3h2c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-8z M4 11v8 M3 13h1",
    Tank: "M2 12h20v6H2z M4 10h16v2H4z M7 6h10a3 3 0 0 1 3 3H4a3 3 0 0 1 3-3z M14 4h2v2h-2z",

    // Body Parts / Status
    Silhouette: "M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4a4 4 0 0 1 4-4z M12 10c-5 0-8 3-8 8v4h16v-4c0-5-3-8-8-8z",
    Skull: "M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3.5 5.5v2.5h7v-2.5c2-1 3.5-3 3.5-5.5a7 7 0 0 0-7-7z M9 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z m4.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z m-3 7h3v1h-3z",

    // Equipment
    Backpack: "M8 6v-1a3 3 0 0 1 6 0v1h2v14H6V6h2zm2 0h4v-1a1 1 0 0 0-2 0v1h-2z M7 8v10h10V8H7z",
    Ammo: "M5 6v12h4V6H5zm6 0v12h4V6h-4zm6 0v12h4V6h-4z M5 4h4v1H5V4zm6 0h4v1h-4V4zm6 0h4v1h-4V4z",
    Star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
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
    // Force specific colors for skills if default currentColor is passed
    const isDefaultColor = color === "currentColor";

    // Weapons (Keep user color, usually metallic or themed by inspector)
    if (id.includes('pistol') || id.includes('beretta') || id.includes('eagle') || id.includes('dual')) return <SvgIcon path={AssetPath.Pistol} size={size} color={color} />;
    if (id.includes('revolver')) return <SvgIcon path={AssetPath.Revolver} size={size} color={color} />;
    if (id.includes('sniper') || id.includes('sparrow') || id.includes('magellan') || id.includes('jungle') || id.includes('mos')) return <SvgIcon path={AssetPath.Sniper} size={size} color={color} />;
    if (id.includes('shotgun') || id.includes('scatter') || id.includes('pump') || id.includes('double_barrel')) return <SvgIcon path={AssetPath.Shotgun} size={size} color={color} />;
    if (id.includes('rifle') || id.includes('m16') || id.includes('ak47') || id.includes('famas') || id.includes('thompson') || id.includes('ump')) return <SvgIcon path={AssetPath.Rifle} size={size} color={color} />;
    if (id.includes('machinegun') || id.includes('minigun') || id.includes('gatling') || id.includes('comanche') || id.includes('heavy_machine')) return <SvgIcon path={AssetPath.Minigun} size={size} color={color} />;
    if (id.includes('knife') || id.includes('sword')) return <SvgIcon path={AssetPath.Knife} size={size} color={color} />;
    if (id === 'fists' || id.includes('fist')) return <SvgIcon path={AssetPath.Fist} size={size} color={color} />;
    if (id.includes('grenade') || id.includes('flashbang') || id.includes('gas') || id.includes('glue') || id.includes('shock')) return <SvgIcon path={AssetPath.Grenade} size={size} color={isDefaultColor ? '#a3a3a3' : color} />;
    if (id.includes('rocket') || id.includes('bazooka') || id.includes('infernal')) return <SvgIcon path={AssetPath.RocketLauncher} size={size} color={color} />;

    // Equipment / Armor
    if (id.includes('bulletproof') || id.includes('vest') || id.includes('armor') || id.includes('protection') || id.includes('heavy_armor')) return <SvgIcon path={AssetPath.Vest} size={size} color={isDefaultColor ? '#64748b' : color} />;
    if (id.includes('shell') || id.includes('ammo') || id.includes('munition')) return <SvgIcon path={AssetPath.Ammo} size={size} color={isDefaultColor ? '#fcd34d' : color} />;
    if (id.includes('rucksack') || id.includes('backpack') || id.includes('load') || id.includes('carrier')) return <SvgIcon path={AssetPath.Backpack} size={size} color={isDefaultColor ? '#a16207' : color} />;

    // Skills (Colored if default)
    if (id.includes('heart') || id === 'anatomy' || id === 'survival' || id.includes('survivor')) return <SvgIcon path={AssetPath.Heart} size={size} color={isDefaultColor ? '#ef4444' : color} />;
    if (id.includes('muscle') || id === 'load_bearer' || id.includes('strong') || id.includes('heavyweight')) return <SvgIcon path={AssetPath.Muscle} size={size} color={isDefaultColor ? '#f97316' : color} />;
    if (id.includes('sprint') || id === 'dash' || id.includes('speed') || id.includes('hurry') || id.includes('hyperactive') || id.includes('rush')) return <SvgIcon path={AssetPath.Lightning} size={size} color={isDefaultColor ? '#eab308' : color} />;
    if (id.includes('scope') || id.includes('eye') || id === 'vision' || id.includes('binocular') || id.includes('sensor')) return <SvgIcon path={AssetPath.Eye} size={size} color={isDefaultColor ? '#3b82f6' : color} />;
    if (id.includes('aim') || id === 'sniper_training' || id.includes('crosshair') || id.includes('laser')) return <SvgIcon path={AssetPath.Crosshair} size={size} color={isDefaultColor ? '#ef4444' : color} stroke={true} />;
    if (id.includes('shield') || id.includes('cover') || id.includes('sturdy') || id.includes('brick')) return <SvgIcon path={AssetPath.Shield} size={size} color={isDefaultColor ? '#9ca3af' : color} />;
    if (id.includes('medic') || id === 'first_aid' || id.includes('heal') || id.includes('doctor')) return <SvgIcon path={AssetPath.FirstAid} size={size} color={isDefaultColor ? '#ef4444' : color} />;
    if (id.includes('radio') || id === 'comms' || id.includes('talky') || id.includes('walkie') || id.includes('commander')) return <SvgIcon path={AssetPath.WalkieTalkie} size={size} color={isDefaultColor ? '#374151' : color} />;
    if (id.includes('explosive') || id === 'sabotage' || id.includes('saboteur')) return <SvgIcon path={AssetPath.Explosion} size={size} color={isDefaultColor ? '#f59e0b' : color} />;
    if (id.includes('magnet') || id === 'scavenger') return <SvgIcon path={AssetPath.Magnet} size={size} color={isDefaultColor ? '#6b7280' : color} />;

    // Vehicles
    if (id.includes('tank') || id.includes('vehicle')) return <SvgIcon path={AssetPath.Tank} size={size} color={isDefaultColor ? '#4b5563' : color} />;

    // Special skills
    if (id.includes('star') || id.includes('lucky') || id.includes('charm')) return <SvgIcon path={AssetPath.Star} size={size} color={isDefaultColor ? '#fbbf24' : color} />;
    if (id.includes('skull') || id.includes('death') || id.includes('martyr')) return <SvgIcon path={AssetPath.Skull} size={size} color={isDefaultColor ? '#a8a29e' : color} />;

    // Default fallback
    return <SvgIcon path={AssetPath.HelmetSoldier} size={size} color={color} />;
};

export const GetWeaponIcon = GetSkillIcon;
