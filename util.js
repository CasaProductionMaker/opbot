// util.js
// Contains utility functions for the bot.
// Edited by stormlet on 5/29/2025

import fs from "fs";
import { petalStats } from "./petals.js";
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
    if (!profile.loadout) profile.loadout = ["0_0", "-1_0", "-1_0"];
    if (!profile.second_loadout) profile.second_loadout = ["-1_0", "-1_0", "-1_0"];
    if (!profile.health) profile.health = 30;
    if (!profile.talents) profile.talents = {
        "loadout": 3,
        "evasion": 0,
        "max_hp": 0
    };
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