// const.js
// Contains basic gameplay constants.
// Edited by stormlet on 5/29/2025

export const petalRarities = [
    "Common",
    "Unusual",
    "Rare",
    "Epic",
    "Legendary",
    "Mythic",
    "Ultra",
    "Super",
    "Unique"
];

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

export const talentCosts = {
    "loadout": [0, 0, 0, 100, 3000, 10000, 300000, 1000000],
    "evasion": [],
    "max_hp": []
}
