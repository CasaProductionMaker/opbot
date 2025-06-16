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
    [0.1, 0.6], 
    [0.1, 0.8], 
    [0.05, 0.85], 
    [0.05, 0.95],
    [0.05, 0.99], 
    [0.83, 99.9995], //0.05% chance for ultra drop
    [0.7, 0.99999] // 0.001% chance for super drop
]

// Cost in stars for each level of talents, starting at 0.
export const talentCosts = {
    "loadout": [0, 0, 15, 100, 3000, 10000, 300000, 1000000, 5000000, 10000000],
    "evasion": [10, 50, 250, 1250, 6250, 31250, 156250, 444444, 1000000, 2500000],
    "max_hp": [10, 50, 250, 1250, 6250, 31250, 156250, 444444, 1000000, 2500000], 
    "rare_drop_rate": [100, 500, 10000, 100000, 500000],
    "craft_chance": [100, 500, 1000, 10000, 30000, 100000, 300000, 1000000, 3000000, 4444444]
}

export const rareMobSpawn = 0.05; // chance for mob to be 1 rarity above
export const superMobSpawn = 0.5; // 1% chance
export const rareLootChance = 0.05;
export const targetDummyHealth = 1000000000000000;
