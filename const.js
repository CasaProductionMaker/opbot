// const.js
// Contains basic gameplay constants.
// Edited by stormlet on 5/29/2025

export const petalRarities = [
    "Common",       // 0
    "Unusual",      // 1
    "Rare",         // 2
    "Epic",         // 3
    "Legendary",    // 4
    "Mythic",       // 5
    "Ultra",        // 6
    "Super",        // 7
    "Unique"        // 8
];


export const petalLowercaseRarities = petalRarities.map(s => s.toLowerCase());

export const petalCraftChances = [
    0.64,
    0.32,
    0.16,
    0.08,
    0.04, 
    0.02,
    0.01, 
    1.0
]

export const dropRarityChances = [
    [0, 0.75], 
    [0.1, 0.8], 
    [0.05, 0.9], 
    [0.01, 0.95], 
    [0.05, 0.97],
    [0.2, 0.99], 
    [0.8, 0.999], //0.1% chance for ultra drop
    [0.6, 0.9999] // 0.01% chance for super drop
]

// Cost in stars for each level of talents, starting at 0.
export const talentCosts = {
    "loadout": [0, 0, 15, 100, 3000, 10000, 300000, 1000000],
    "evasion": [],
    "max_hp": [10, 50, 250, 1250, 6250, 31250, 156250, 444444], 
    "rare_drop_rate": [100, 500, 10000, 500000]
}

export const rareMobSpawn = 0.05; // chance for mob to be 1 rarity above
export const superMobSpawn = 0.005; // 0.5% chance
export const rareLootChance = 0.05;
export const targetDummyHealth = 1000000000000000;
