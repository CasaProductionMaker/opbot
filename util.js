// util.js
// Contains utility functions for the bot.
// Edited by stormlet on 5/29/2025

import fs from "fs";
import { petalStats } from "./petals.js";
import { petalTypes } from "./petals.js";
import { petalRarities } from "./const.js";
const dataFile = "saved_data.json";

export function getCurrentTime() {
    let date = new Date();
    return date.getTime();
}

export function fillInProfileBlanks(profile) {
    if (!profile.xp) profile.xp = 0;
    profile.level = Math.floor(Math.sqrt(profile.xp) * 0.6);
    if (!profile.stars) profile.stars = 0;
    if (!profile.inventory) profile.inventory = {"0": [0, 0, 0, 0, 0, 0, 0, 0, 0]};
    if (!profile.loadout) profile.loadout = ["0_0", "13_0"];
    if (!profile.second_loadout) profile.second_loadout = ["-1_0", "-1_0"];
    if (!profile.health) profile.health = 30;
    if (!profile.talents) profile.talents = {
        "loadout": 2,
        "evasion": 0,
        "max_hp": 0,
        "rare_drop_rate": 0,
        "extra_petal_drops": 0
    };

    let talent_list = ["loadout", "evasion", "max_hp", "rare_drop_rate", "extra_petal_drops"];

    for (const talent of talent_list) {
        if (!profile.talents[talent]) profile.talents[talent] = 0;
    }

    let totalMH = 0;
    for(let i = 0; i < profile.talents.loadout; i++) {
        // Add empty slots if needed
        if(profile.loadout[i] == undefined) profile.loadout.push("-1_0");
        if(profile.second_loadout[i] == undefined) profile.second_loadout.push("-1_0");
        // Ignore non-petals
        if(profile.loadout[i].split("_")[0] == "-1") continue;
        totalMH += petalStats[profile.loadout[i].split("_")[0]].max_health * (3 ** profile.loadout[i].split("_")[1]);
    }
    let maxHPMultiplier = 1+0.1*profile.talents.max_hp;
    profile.max_health = Math.floor((Math.sqrt(5 * profile.xp) + 30)*maxHPMultiplier) + totalMH;
    return profile;
}
export function getCraftCost(rarity) {
    return Math.floor((10 * rarity ** 3) + 5)
}

// Gets the petal type from a petal string. Petal string is
// "n_m" where n is the id and m is the rarity
export function getPetalType(petal) {
    return petalTypes[petal];
}

// Gets the petal rarity
export function getPetalRarity(petal) {
    return petalRarities[petal];
}

// Gets the petal dmg
export function getPetalDamage(petal, rarity) {
    return Math.floor(petalStats[petal].damage * (3 ** rarity));
}

// Returns a string of the petal, like "Common Light (2 Damage): 5x"
export function petalToText(petal, inter, data, includeNumber = true) {
    console.log(data[inter.user.id].inventory[petal])
    let petalAmounts = data[inter.user.id].inventory[petal];
    
    // check if user has any of the petal
    let hasPetal = false;
    for (let i = 0; i < petalAmounts.length; i++) {
        if (petalAmounts[i] > 0) {
            hasPetal = true;
            break;
        }
    }
    if (!hasPetal) {
        return "";
    }

    // get petal type
    let petalStrings = [];
    for (let i = 0; i < petalAmounts.length; i++) {
        if(petalAmounts[i] > 0) {
            let petalRarity = petalRarities[i];
            let petalDamageValue = getPetalDamage(petal, i);
            petalStrings.push(`  - ${petalRarity} (${petalDamageValue} Damage): ${petalAmounts[i]}x`);
        }
    }

    return "- " + petalTypes[petal] + "\n" + petalStrings.join("\n") + "\n";
}

export function singlePetalToText(petal) {
    let petalRarity = getPetalRarity(petal.split("_")[1]);
    let petalType = petalTypes[petal.split("_")[0]];
    let petalDamageValue = getPetalDamage(petal.split("_")[0], petal.split("_")[1]);
    return `- ${petalRarity} ${petalType} (${petalDamageValue} Damage)\n`;
}

// Display text for loadout
export function makeLoadoutText(userid, data, secondary = false) {
    let loadoutText = "";
    let loadout = secondary ? data[userid].second_loadout : data[userid].loadout;
    for (const i in loadout) {
        const petal = loadout[i];
        if (petal.split("_")[0] == "-1") {
            loadoutText += `- Empty Slot!\n`;
            continue;
        }
        loadoutText += singlePetalToText(petal);
    }
    return loadoutText;
}



// checks if a petal is equipped. If yes, returns rarity; else returns -1
export function isPetalEquipped(petal, userid, data) {
    for (const p in data[userid]["loadout"]) {
        if(p.split("_")[0] == petal) {
            return p.split("_")[1]
        }
    }
    return -1;
}

// generates number of mobs to shoo away with poo
export function pooRepelAmount(userid, data) {
    // check for poo and honey
    let pooRarity = isPetalEquipped(19, userid, data);
    let pooModifier = 0;
    if (pooRarity >= 0) {
        pooModifier = -1 // always remove 1 mob
        if(Math.random() < pooRarity/8) { // chance to remove 2 mobs
            pooModifier -= 1
            if(Math.random() < pooRarity/16) { // chance to remove 3 mobs
                pooModifier -= 1
            }
        }
    }
    return pooModifier;
}

// same as above but for honey
export function honeyAttractAmount(userid, data) {
    let honeyRarity = isPetalEquipped(21, userid, data);
    let honeyModifier = 0;
    if (honeyRarity >= 0) {
        honeyModifier = 1 // always add 1 mob
        if(Math.random() < honeyRarity/8) { // chance to add 2 mobs
            honeyModifier += 1
            if(Math.random() < honeyRarity/16) { // chance to add 3 mobs
                honeyModifier += 1
            }
        }
    }
    return honeyModifier;
}

// function to cut off the decimals if needed
export function cutDecimals(num, decimals = 2) {
    return Math.floor(num * (10 ** decimals)) / (10 ** decimals);
}

export function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
}

export function editXP(userid, amount, data) {
    let xp = data[userid]["xp"] || 0;
    data[userid]["xp"] = xp + amount;
    saveData(data);
}