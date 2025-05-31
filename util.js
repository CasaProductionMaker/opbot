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
    if (!profile.loadout) profile.loadout = [0, -1, -1];
    if (!profile.health) profile.health = 30;
    let totalMH = 0;
    for(let i = 0; i < 3; i++) {
        if(profile.loadout[i].split("_")[0] == "-1") continue;
        // console.log("petal id", profile.loadout[i].split("_")[0]);
        // console.log("petalstats", petalStats[profile.loadout[i].split("_")[0]]);
        // console.log("max_health", petalStats[profile.loadout[i].split("_")[0]].max_health);
        totalMH += petalStats[profile.loadout[i].split("_")[0]].max_health * (3 ** profile.loadout[i].split("_")[1]);
    }
    profile.max_health = Math.floor(Math.sqrt(5 * profile.xp) + 30) + totalMH;
    return profile;
}
export function getCraftCost(rarity) {
    return Math.floor((20 * rarity ** 5) + 5)
}