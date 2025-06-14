// grind.js
// Handles mob spawning and zone advancement

const mobsfile = require('../mobs');
const constants = require('../const');
const util = require('../util');
const petals = require('../petals');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ContainerBuilder } = require('discord.js');

const petalStats = petals.petalStats;
const petalTypes = petals.petalTypes;
const mobStats = mobsfile.mobStats;
const petalRarities = constants.petalRarities;
const petalLowercaseRarities = petalRarities.map(s => s.toLowerCase());
const dropRarityChances = constants.dropRarityChances;
const getPetalRarity = util.getPetalRarity;
const getPetalType = util.getPetalType;
const saveData = util.saveData;
const biomes = mobsfile.biomes;
const isPetalEquipped = util.isPetalEquipped;

function generateMobs(biome, zone, rarity, userId, data, client) {
    let mobAmount = Math.round(Math.random() * constants.petalLowercaseRarities.indexOf(rarity) + 2);
    
    // check for poo and honey
    mobAmount += util.pooRepelAmount(userId, data);
    mobAmount += util.honeyAttractAmount(userId, data);
    mobAmount = Math.max(mobAmount, 1);
    
    let mobs = [];
    const possibleMobs = mobsfile.biomes[biome].map[zone].mobs;
    for (let i = 0; i < mobAmount; i++) {
        let randomID = Math.floor(Math.random() * possibleMobs.length);
        let mob = possibleMobs[randomID];
        if (mobsfile.mobStats[mob].reroll) {
            mob = possibleMobs[Math.floor(Math.random() * possibleMobs.length)];
        }
        mobs.push(mob);
    }
    
    let mobInfo = [];
    for (let i = 0; i < mobs.length; i++) {
        let mob_rarity = constants.petalRarities[constants.petalLowercaseRarities.indexOf(rarity)];
        if (rarity !== "ultra") {
            if (Math.random() < constants.rareMobSpawn) {
                mob_rarity = constants.petalRarities[Math.min(constants.petalLowercaseRarities.indexOf(rarity) + 1, 6)];
            }
            mobInfo[i] = createMobInfo(mobs[i], mob_rarity);
        } else {
            mobInfo[i] = handleUltraRarity(mobs[i], mob_rarity, data, client);
        }
    }
    
    return { mobs, mobInfo, mobAmount };
}

function createMobInfo(mob, rarity) {
    return {
        name: mob,
        loot: mobsfile.mobStats[mob].loot,
        rarity: rarity,
        health: mobsfile.mobStats[mob].health * (5 ** constants.petalRarities.indexOf(rarity)),
        damage: Math.ceil(mobsfile.mobStats[mob].damage * (3 ** constants.petalRarities.indexOf(rarity))),
        dead: false
    };
}

function handleUltraRarity(mob, rarity, data, client) {
    if (Math.random() < constants.superMobSpawn) {
        console.log(`Super mob spawned: ${mob}`);
        if (!data["super-mob"]) {
            data["super-mob"] = {
                name: mob,
                health: mobsfile.mobStats[mob].health * 78125,
                damage: mobsfile.mobStats[mob].damage * 2187,
                loot: mobsfile.mobStats[mob].loot * 16384,
                damagers: {}
            };
            saveData(data);
            client.channels.cache.get("1371202463994216588").send({
                content: `A Super ${mob} has spawned!\nHealth: ${data["super-mob"].health}\nDamage:${data["super-mob"].damage}\nLoot: ${data["super-mob"].loot}`,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("super-mob")
                                .setLabel("Attack!")
                                .setStyle(ButtonStyle.Danger)
                        )
                ]
            });
        }
    }
    return createMobInfo(mob, rarity);
}

function createActionRow(mobs, mobInfo = null) {
    if (mobInfo === null) {
        let rows = [];
        let buttonsSoFar = 0;
        for (let i = 0; i < mobs.length; i++) {
            
            // build petals
            if(buttonsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }

            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(i.toString())
                    .setLabel(`Attack ${mobs[i]}`)
                    .setStyle(ButtonStyle.Danger)
            );
            buttonsSoFar++;
        }
        return rows;
    } else {
        let rows = [];
        let buttonsSoFar = 0;
        for (let i = 0; i < mobs.length; i++) {
            
            // build petals
            if(buttonsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }

            if(mobInfo[i].health <= 0) {
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel(`Defeated ${mobInfo[i].name}!`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                )
            } else {
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel(`Attack ${mobInfo[i].name}`)
                        .setStyle(ButtonStyle.Danger)
                )
            }
            buttonsSoFar++;
        }
        return rows;
    }
}

// Calculate total damage from a player's loadout
function calculatePlayerDamage(loadout) {
    let totalDamage = 0;
    for (const petal of loadout) {
        if (petal === "-1_0") continue;
        const [petalId, rarity] = petal.split("_");
        totalDamage += (petalStats[petalId]?.damage || 0) * (3 ** (parseInt(rarity) || 0));
    }
    return totalDamage;
}

// Apply damage to a mob, considering armor and other modifiers
function applyDamageToMob(mob, damage, mobInfo) {
    if (mobInfo.armour) {
        const mobRarity = petalRarities.indexOf(mob.rarity);
        const mobArmour = Math.floor(mobInfo.armour * (3 ** mobRarity));
        damage = Math.max(1, damage - mobArmour);
    }
    mob.health -= Math.floor(damage);
    return damage;
}

// Handle mob death and distribute loot
function handleMobDeath(mob, mobInfo, data, interaction) {
    const xpGain = Math.floor(mobInfo.xp * (1 + (0.1 * (data[interaction.user.id].talents?.xp_gain || 0))));
    const starsGain = Math.floor(xpGain * 0.5);
    
    data[interaction.user.id]["xp"] = (data[interaction.user.id]["xp"] || 0) + xpGain;
    data[interaction.user.id]["stars"] = (data[interaction.user.id]["stars"] || 0) + starsGain;
    
    // Handle petal drops
    const dropRarityRoll = Math.random();
    let dropRarity = 0;
    for (let i = 0; i < dropRarityChances.length; i++) {
        if (dropRarityRoll < dropRarityChances[i]) {
            dropRarity = i;
            break;
        }
    }
    
    if (dropRarity > 0) {
        const petalDrops = mobInfo.drops || [];
        if (petalDrops.length > 0) {
            const randomPetal = petalDrops[Math.floor(Math.random() * petalDrops.length)];
            data[interaction.user.id]["inventory"][randomPetal][dropRarity] = (data[interaction.user.id]["inventory"][randomPetal][dropRarity] || 0) + 1;
            return `You defeated ${mob.name} and earned ${xpGain} XP and ${starsGain} stars!\nYou also found a ${petalRarities[dropRarity]} ${petalTypes[randomPetal]}!`;
        }
    }
    
    return `You defeated ${mob.name} and earned ${xpGain} XP and ${starsGain} stars!`;
}

// Handle super mob death and distribute loot
function handleSuperMobDeath(superMob, mobInfo, data) {
    const totalLoot = superMob.loot;
    const allLooters = {};
    
    for (const damagerId in superMob.damagers) {
        const loot = Math.floor((superMob.damagers[damagerId] / (mobInfo.health * 2187)) * totalLoot);
        allLooters[damagerId] = loot;
        data[damagerId] = data[damagerId] || {};
        data[damagerId]["xp"] = (data[damagerId]["xp"] || 0) + loot;
        data[damagerId]["stars"] = (data[damagerId]["stars"] || 0) + Math.ceil(loot / 2);
    }
    
    delete data["super-mob"];
    saveData(data);
    
    let lootList = "";
    for (const damagerId in allLooters) {
        lootList += `<@${damagerId}>: ${allLooters[damagerId]} XP, ${Math.ceil(allLooters[damagerId] / 2)} stars\n`;
    }
    
    return {
        content: `The Super ${superMob.name} has been defeated!\n**Loot distribution:** \n${lootList}`,
        components: []
    };
}

function createMobList(mobs, mobInfo) {
    return mobs.map((mob, i) => 
        `${mobInfo[i].rarity} ${mob}: ${mobInfo[i].health} HP, ${mobInfo[i].damage} DMG`
    ).join('\n');
}

function getTotalDamage(data, userID, mobToAttack=null, isSuperMob=false) {
    let totalPlayerDamage = 0;
    let extraInfo = "";
    // check for double damage from faster
    let doubleDamage = false;
    if(data[userID]["loadout"].includes(9)) {
        doubleDamage = (Math.random() < (petalStats[9].rotation * (data[userID].inventory["9"] + 1)));
    }

    // check if user has bur
    let bur = 0;
    for (const petal of data[userID]["loadout"]) {
        if(petal.split("_")[0] == 15) {
            bur = petalStats[15].pierce * (3 ** (petal.split("_")[1] || 0));
            bur = Math.floor(bur);
            break;
        }
    }

    // get triangle count
    let triangle_count = 0;
    for (const petal of data[userID]["loadout"]) {
        if (petal.split("_")[0] == 22) {
            triangle_count += 1;
        }
    }
    
    // check all petals for dmg and heals
    for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
        for (const petal of data[userID]["loadout"]) {
            p_id = petal.split("_")[0];
            if (p_id == -1) continue; // Skip if petal is -1

            // Missile
            if (p_id == 8 && !isSuperMob && mobToAttack !== null) {
                let mobToHit = Math.floor(Math.random() * data[userID]["grind-info"].mobs.length);
                if(data[userID]["grind-info"].mobs[mobToHit].health > 0) {
                    data[userID]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                } else {
                    extraInfo += "\nYour Missile missed!"
                }
                continue;
            }

            // Lightning
            if (p_id == 11 && !isSuperMob && mobToAttack !== null) {
                for (let mobID = 0; mobID < data[userID]["grind-info"].mobs.length; mobID++)
                if(data[userID]["grind-info"].mobs[mobID].health > 0) {
                    data[userID]["grind-info"].mobs[mobID].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                }
                continue;
            }

            // Glass
            if (p_id == 12 && !isSuperMob && mobToAttack !== null) {
                let mobToHit = Math.floor(Math.random() * data[userID]["grind-info"].mobs.length);
                if(data[userID]["grind-info"].mobs[mobToHit].health > 0 && mobToHit != mobToAttack) {
                    data[userID]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                }
            }

            // Stinger
            if (p_id == 16) { // 35% miss chance
                // counteract regular dmg application with a subtraction
                totalPlayerDamage -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));

                let hitTimes = 0;
                let hitRNG = Math.random();
                if(hitRNG < 0.65) {
                    totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                    hitTimes++;
                }
                
                hitRNG = Math.random();
                if(hitRNG < 0.65) {
                    totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                    hitTimes++;
                }
                extraInfo += `\nYour Stinger hit ${hitTimes} time(s)!`;
            }

            // Triangle
            if (p_id == 22) {
                totalPlayerDamage += (petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0)) * triangle_count);
                continue;
            }

            totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
            
            if(mobToAttack !== null && !isSuperMob) {
                // check mob armour
                let mobInfo = mobStats[data[userID]["grind-info"].mobs[mobToAttack].name]
                if(mobInfo.armour) {
                    let mobRarity = petalRarities.indexOf(data[userID]["grind-info"].mobs[mobToAttack].rarity)
                    let mobArmour = mobInfo.armour * (3 ** mobRarity);
                    mobArmour = Math.floor(mobArmour);
                    totalPlayerDamage -= mobArmour;
                }
            }
            
            // apply bur buff multiplied by petal count
            totalPlayerDamage += bur * (petalStats[p_id].count || 1);

            // heal player based on petal's heal
            data[userID]["health"] += petalStats[p_id].heal * (3 ** (petal.split("_")[1] || 0))
        
            // do not heal past max health
            if(data[userID]["health"] > data[userID]["max_health"]) {
                data[userID]["health"] = data[userID]["max_health"]
            }
        }
    }
    totalPlayerDamage = Math.max(totalPlayerDamage, 0);
    return { totalPlayerDamage , extraInfo };
}

module.exports = {
    name: 'grind',
    description: 'Grind for stars',
    grind(interaction, data, client) {
        const biome = interaction.options.get('biome');
        const zone = mobsfile.biomes[biome.value].startingZone;
        const rarity = "common";
        const user = interaction.user;
        
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        if (data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        const { mobs, mobInfo, mobAmount } = generateMobs(biome.value, zone, rarity, user.id, data, client);
        const row = createActionRow(mobs);
        
        data[user.id]["grind-info"] = {
            biome: biome.value,
            rarity: rarity, 
            mobs: mobInfo, 
            messageID: interaction.id, 
            mobsLeft: mobAmount, 
            zone: zone
        };
        saveData(data);
        
        const mobList = createMobList(mobs, mobInfo);
        interaction.reply({
            content: `You are grinding in the ${mobsfile.biomes[biome.value].name} for ${rarity} mobs.\n**Zone: ${zone}**\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
            components: row, 
            flags: MessageFlags.Ephemeral
        });
    },

    continueGrind(interaction, data, saveData, client) {
        const user = interaction.user;
        const grindInfo = data[user.id]?.["grind-info"];
        
        if (!grindInfo) {
            interaction.reply("No active grind session found.");
            return;
        }
        
        const { biome, rarity, zone } = grindInfo;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        if (data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        const { mobs, mobInfo, mobAmount } = generateMobs(biome, zone, rarity, user.id, data, client);
        const row = createActionRow(mobs);
        
        data[user.id]["grind-info"] = {
            biome,
            rarity, 
            mobs: mobInfo, 
            messageID: interaction.id, 
            mobsLeft: mobAmount, 
            zone
        };
        saveData(data);
        
        const mobList = createMobList(mobs, mobInfo);
        interaction.update({
            content: `You are grinding in the ${mobsfile.biomes[biome].name} for ${rarity} mobs.\n**Zone: ${zone}**\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
            components: row, 
            flags: MessageFlags.Ephemeral
        });
    },

    attackMob(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        util.saveData(data);
        let mobToAttack = interaction.customId;

        // safeguards
        if(!data[user.id]["grind-info"]) {
            interaction.reply("You are not grinding! Use /grind to start grinding.");
            return;
        }
        if(!data[user.id]["grind-info"].mobs[mobToAttack]) {
            interaction.reply("Woah that was too fast for my code :skull:");
            return;
        }

        // calculate petal dmg
        if(data[user.id]["grind-info"].mobs[mobToAttack].health > 0) {
            let totalPlayerDamage = 0;
            let extraInfo = "";

            // check if user has goldenleaf
            let gleafDmgIncrease = 1;
            for (const petal of data[user.id]["loadout"]) {
                if(petal.split("_")[0] == 17) {
                    gleafDmgIncrease = (1.1 ** ((petal.split("_")[1]-2) || 0));
                    break;
                }
            }

            // do bubble stuff
            let bubbleRarity = -1;
            let grindRarity = data[user.id]["grind-info"].rarity;
            let skipZone = false;
            for (const petal of data[user.id]["loadout"]) {
                if(petal.split("_")[0] == "18") {
                    bubbleRarity = parseInt(petal.split("_")[1]);
                    break;
                }
            }
            if(bubbleRarity >= 0 && bubbleRarity >= grindRarity) {
                skipZone = true;
            }

            // check if user has talisman
            let talismanChance = 0;
            for (const petal of data[user.id]["loadout"]) {
                if(petal.split("_")[0] == 20) {
                    talismanChance = petalStats[20].evasion + (0.05 * (parseInt(petal.split("_")[1]) || 0));
                }
            }

            ({ totalPlayerDamage, extraInfo } = getTotalDamage(data, user.id, mobToAttack)); // Calculate total damage from loadout

            // apply dmg
            data[user.id]["grind-info"].mobs[mobToAttack].health -= Math.floor(totalPlayerDamage * gleafDmgIncrease);
            util.saveData(data);

            updatedComponents = interaction.message.components;

            // calculate player armour from root
            let armour = 0;
            for (let i = 0; i < data[user.id]["loadout"].length; i++) {
                if(data[user.id]["loadout"][i].split("_")[0] != -1 && petalStats[data[user.id]["loadout"][i].split("_")[0]].armour) {
                    armour += petalStats[data[user.id]["loadout"][i].split("_")[0]].armour * (3 ** (data[user.id]["loadout"][i].split("_")[1] || 0));
                }
            }

            armour = Math.floor(armour);

            // All mobs update
            let totalDamage = 0;
            for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                // if mob is not dead
                if(data[user.id]["grind-info"].mobs[i].health > 0) {
                    if(Math.random() < talismanChance) {
                        // if talisman equipped, chance to not take damage
                        extraInfo += `\nYour Talisman has allowed you to evade a mob!`;
                        continue;
                    }
                    // do damage
                    totalDamage += Math.ceil(data[user.id]["grind-info"].mobs[i].damage);
                }

                // if a mob has died from this attack, count down with mobsLeft and update the button
                if (data[user.id]["grind-info"].mobs[i].health <= 0 && !data[user.id]["grind-info"].mobs[i].dead) {
                    data[user.id]["grind-info"].mobsLeft -= 1;
                    data[user.id]["grind-info"].mobs[i].dead = true;
                    util.saveData(data);
                    let rows = [];
                    let buttonsSoFar = 0;
                    for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                        
                        // build petals
                        if(buttonsSoFar % 5 == 0) {
                            rows.push(new ActionRowBuilder());
                        }
                        
                        if(data[user.id]["grind-info"].mobs[i].health <= 0) {
                            rows[rows.length - 1].addComponents(
                                new ButtonBuilder()
                                    .setCustomId(i.toString())
                                    .setLabel(`Defeated ${data[user.id]["grind-info"].mobs[i].name}!`)
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            )
                        } else {
                            rows[rows.length - 1].addComponents(
                                new ButtonBuilder()
                                    .setCustomId(i.toString())
                                    .setLabel(`Attack ${data[user.id]["grind-info"].mobs[i].name}`)
                                    .setStyle(ButtonStyle.Danger)
                            )
                        }
                        buttonsSoFar++;
                    }
                    updatedComponents = rows;
                }
            }

            //damage player
            if(totalDamage > armour) {
                data[user.id]["health"] -= totalDamage - armour;
            }
            util.saveData(data);
            if (data[user.id]["health"] <= 0) {
                delete data[user.id]["grind-info"];
                util.saveData(data);
                interaction.update({
                    content: `You have died! Better luck next time!`, 
                    components: [], 
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            
            // if all mobs are dead, end grind
            if (data[user.id]["grind-info"].mobsLeft <= 0) {
                let totalXP = 0;
                let petalDrops = [];
                let rareLootChance = constants.rareLootChance * ((data[user.id].talents["rare_drop_rate"]) * 0.5 + 1);
                let gotRareLoot = Math.random() < rareLootChance;

                // calc petal drops
                for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                    // get xp for the mob (no rare loot applied)
                    let mobRarityID = petalRarities.indexOf(data[user.id]["grind-info"].mobs[i].rarity);
                    totalXP += data[user.id]["grind-info"].mobs[i].loot * (4 ** mobRarityID);

                    let petalRolls = 1;
                    if(gotRareLoot) {
                        petalRolls = 4;
                    }
                    for(let b = 0; b < petalRolls; b++) {
                        for (const p of mobStats[data[user.id]["grind-info"].mobs[i].name].petalDrop) {
                            const randomLootDropChance = Math.random() * 2;
                            if(randomLootDropChance <= 1.0) {
                                const grindRarity = mobRarityID;
                                let petalToDrop = p;

                                if(randomLootDropChance <= dropRarityChances[grindRarity][0]) {
                                    petalToDrop += "_" + (grindRarity - 2);
                                } else if(randomLootDropChance <= dropRarityChances[grindRarity][1]) {
                                    petalToDrop += "_" + (grindRarity - 1);
                                } else {
                                    petalToDrop += "_" + grindRarity;
                                }
                                if (petalToDrop.split("_")[1] < 0) { // filter "below common" rarities
                                    continue;
                                }

                                // golden leaf overrides petal drop
                                if(petalToDrop.split("_")[0] == "17") {
                                    if(grindRarity < 4) continue;
                                    
                                    if(randomLootDropChance < (1-dropRarityChances[grindRarity-2][1])) {
                                        // For -2 rarity, it's the chance of that rarity dropping same rarity petal
                                        petalToDrop = "17_" + (grindRarity-2);
                                        petalDrops.push(petalToDrop);
                                    } else if (randomLootDropChance < (1-dropRarityChances[grindRarity-1][1])/2) {
                                        // For -1 rarity, it's the chance of that rarity dropping same rarity petal divided by 2
                                        petalToDrop = "17_" + (grindRarity-1);
                                        petalDrops.push(petalToDrop);
                                    } else if (randomLootDropChance < (1-dropRarityChances[grindRarity][1])/3) {
                                        // For same rarity, it's the chance of same rarity drop divided by 3
                                        petalToDrop = "17_" + grindRarity;
                                        petalDrops.push(petalToDrop);
                                    } else {
                                        continue;
                                    }
                                }

                                petalDrops.push(petalToDrop);
                            }
                        }
                    }
                }
                // add rare loot multiplier
                if(gotRareLoot) {
                    totalXP *= 5;
                }
                util.editXP(user.id, totalXP, data);
                data[user.id]["stars"] = (data[user.id]["stars"] || 0) + Math.ceil(totalXP / 5);

                // Update player inventory with drops
                let petalDropText = "\n**New petals dropped!**";
                for(const pet in petalDrops) {
                    let the_petal = petalDrops[pet];
                    let petal_id = the_petal.split("_")[0];
                    let petal_rarity = the_petal.split("_")[1];
                    if (petal_rarity < 0) continue;
                    
                    if (!data[user.id]["inventory"][petal_id]) {
                        data[user.id]["inventory"][petal_id] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }

                    data[user.id]["inventory"][petal_id][petal_rarity] += 1;
                    petalDropText += `\n- ${getPetalRarity(petal_rarity)} ${getPetalType(petal_id)}`;
                }
                if(petalDropText == "\n**New petals dropped!**") petalDropText = "";
                util.saveData(data);

                // do not allow further rarity grinding at super level
                if(data[user.id]["grind-info"].rarity == "ultra") {
                    interaction.update({
                        content: `You have completed the grind${gotRareLoot ? " and gotten **Rare Loot**" : ""}! This has given you ${totalXP} XP and ${Math.ceil(totalXP / 2)} stars!${petalDropText}\nWould you like to continue grinding in this zone?`, 
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("continue-grind")
                                        .setLabel("Continue grinding")
                                        .setStyle(ButtonStyle.Primary)
                                )
                        ], 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // generate options for map movement direction (left, right, etc)
                let optionButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("continue-grind")
                            .setLabel("Continue grinding")
                            .setStyle(ButtonStyle.Primary)
                    );
                for (const direction in biomes[data[user.id]["grind-info"].biome].map[data[user.id]["grind-info"].zone].connections) {
                    optionButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`higher-rarity-${biomes[data[user.id]["grind-info"].biome].map[data[user.id]["grind-info"].zone].connections[direction]}`)
                            .setLabel(`Go ${direction}`)
                            .setStyle(ButtonStyle.Success)
                    );
                }

                // allow user to continue grinding or go to higher rarity zone
                interaction.update({
                    content: `You have completed the grind${gotRareLoot ? " and gotten **Rare Loot**" : ""}! This has given you ${totalXP} XP and ${Math.ceil(totalXP / 2)} stars!${petalDropText}\nWould you like to continue grinding in this zone or go to a higher rarity zone?`, 
                    components: [optionButtons], 
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            // if we have a bubble to skip zone, skip the zone
            if(skipZone) {
                // do not allow further rarity grinding at super level
                if(data[user.id]["grind-info"].rarity == "ultra") {
                    interaction.update({
                        content: `You have bubbled through this zone! \nWould you like to continue grinding in this zone?`, 
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("continue-grind")
                                        .setLabel("Continue grinding")
                                        .setStyle(ButtonStyle.Primary)
                                )
                        ], 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // generate options for map movement direction (left, right, etc)
                let optionButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("continue-grind")
                            .setLabel("Continue grinding")
                            .setStyle(ButtonStyle.Primary)
                    );
                for (const direction in biomes[data[user.id]["grind-info"].biome].map[data[user.id]["grind-info"].zone].connections) {
                    optionButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`higher-rarity-${biomes[data[user.id]["grind-info"].biome].map[data[user.id]["grind-info"].zone].connections[direction]}`)
                            .setLabel(`Go ${direction}`)
                            .setStyle(ButtonStyle.Success)
                    );
                }

                // allow user to continue grinding or go to higher rarity zone
                interaction.update({
                    content: `You have bubbled through this zone! \nWould you like to continue grinding in this zone or go to a higher rarity zone?`, 
                    components: [optionButtons], 
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // generate mob list to show in message
            let mobList = "";
            for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                mobList += `${data[user.id]["grind-info"].mobs[i].rarity} ${data[user.id]["grind-info"].mobs[i].name}: ${util.cutDecimals(data[user.id]["grind-info"].mobs[i].health)} HP, ${util.cutDecimals(data[user.id]["grind-info"].mobs[i].damage)} DMG\n`;
            }
            interaction.update({
                content: `You are grinding in the ${biomes[data[user.id]["grind-info"].biome].name} for ${data[user.id]["grind-info"].rarity} mobs.\n**Zone: ${data[user.id]["grind-info"].zone}**${extraInfo}\nYour health: ${util.cutDecimals(data[user.id].health)}\nMobs: \n${mobList}`, 
                components: updatedComponents, 
                flags: MessageFlags.Ephemeral
            });
        } else {
            interaction.deferUpdate();
        }
    },

    superAttack(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        if (data[user.id]["health"] <= 0) {
            interaction.reply({ content: "You are dead! Use /respawn to respawn.", flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (!data["super-mob"]) {
            interaction.reply("The Super is already dead!");
            return;
        }
        
        const superMob = data["super-mob"];
        const mobInfo = mobStats[superMob.name];
        
        // Initialize damager if needed
        superMob.damagers[user.id] = superMob.damagers[user.id] || 0;
        
        // Calculate player damage
        const { totalPlayerDamage } = getTotalDamage(data, user.id, null, true);
        superMob.damagers[user.id] += totalPlayerDamage;
        
        // Apply damage to super mob
        applyDamageToMob(superMob, totalPlayerDamage, mobInfo);
        
        // 1% chance for the mob to hit back
        if (Math.random() < 0.01) {
            data[user.id]["health"] -= superMob.damage;
        }
        
        saveData(data);
        
        // Check if super mob is defeated
        if (superMob.health <= 0) {
            const result = handleSuperMobDeath(superMob, mobInfo, data);
            interaction.update({
                ...result,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        // Update interaction with current super mob status
        interaction.update({
            content: `A Super ${superMob.name} has spawned!\n` +
                    `Last damager: <@${user.id}>\n` +
                    `Health: ${superMob.health}\n` +
                    `Damage: ${superMob.damage}\n` +
                    `Loot: ${superMob.loot}`
        });
    },

    visitDummy(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        if(data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId("attack-dummy")
                .setLabel(`Attack Dummy!`)
                .setStyle(ButtonStyle.Danger)
        )
        saveData(data);

        interaction.reply({
            content: `You are testing your loadout on a Target Dummy.\nDPH (Damage Per Hit): 0`, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        });
    },

    dummyAttack(interaction, data) {
        
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);

        // calculate petal dmg
        let totalPlayerDamage = 0;
        let extraInfo = "";

        // check if user has goldenleaf
        let gleafDmgIncrease = 1;
        for (const petal of data[user.id]["loadout"]) {
            if(petal.split("_")[0] == 17) {
                gleafDmgIncrease = (1.1 ** ((petal.split("_")[1]-2) || 0));
                break;
            }
        }
        
        ({ totalPlayerDamage, extraInfo } = getTotalDamage(data, user.id)); // Calculate total damage from loadout

        // apply dmg
        totalPlayerDamage = Math.floor(totalPlayerDamage * gleafDmgIncrease);
        saveData(data);

        interaction.update({
            content: `You are testing your loadout on a Target Dummy.\nDPH (Damage Per Hit): ${totalPlayerDamage}${extraInfo}`, 
            components: interaction.message.components, 
            flags: MessageFlags.Ephemeral
        });
    }, 

    advancerarity(interaction, data, client) {
        const newZone = interaction.customId.split("higher-rarity-")[1];
        const user = interaction.user;
        
        // Get user's current grind info
        const grindInfo = data[user.id]?.["grind-info"];
        if (!grindInfo) {
            interaction.reply("No active grind session found.");
            return;
        }
        
        const { biome } = grindInfo;
        const currentRarity = grindInfo.rarity;
        const rarityIndex = constants.petalLowercaseRarities.indexOf(currentRarity);
        
        // Check if we can advance rarity
        if (rarityIndex >= constants.petalLowercaseRarities.length - 1) {
            interaction.reply("You are already at the highest rarity level!");
            return;
        }
        
        const newRarity = constants.petalLowercaseRarities[rarityIndex + 1];
        
        // Initialize user data if needed
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        // Check if user is alive
        if (data[user.id].health <= 0) {
            interaction.reply("You are dead! You cannot advance rarity.");
            return;
        }
        
        // Generate mobs for the new zone
        const { mobs, mobInfo, mobAmount } = generateMobs(biome, newZone, newRarity, user.id, data, client);
        const row = createActionRow(mobs);
        
        // Update grind info with new zone and rarity
        data[user.id]["grind-info"] = {
            biome,
            rarity: newRarity,
            mobs: mobInfo,
            messageID: interaction.id,
            mobsLeft: mobAmount,
            zone: newZone
        };
        
        util.saveData(data);
        
        // Create mob list for display
        const mobList = createMobList(mobs, mobInfo);
        
        // Update the interaction with new zone and mobs
        interaction.update({
            content: `You have advanced to ${newRarity} rarity in ${mobsfile.biomes[biome].name}!\n**Zone: ${newZone}**\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`,
            components: row,
            flags: MessageFlags.Ephemeral
        });
    }, 

    respawn(interaction, data, saveData) {
        const user = interaction.user;
        console.log("Respawn etc", data[user.id].health)
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {})
        if(data[user.id]["health"] > 0) {
            interaction.reply("You are not dead! You cannot respawn.");
            return;
        }
        if(!data[user.id].lastRespawn) {
            data[user.id].lastRespawn = 0;
        }

        let maxHealth = data[user.id]["max_health"];
        if (util.getCurrentTime() - data[user.id].lastRespawn < 300000) {
            if(data[user.id]["stars"] < 50) {
                interaction.reply(`You are on cooldown! You can respawn in ${Math.ceil(5 - ((util.getCurrentTime() - data[user.id].lastRespawn) / 60000))} minutes or once you have 50 stars.`);
                return;
            }
            data[user.id].lastRespawn = util.getCurrentTime();
            data[user.id].health = maxHealth;
            data[user.id]["stars"] -= 50;
            if(data["super-mob"] && data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            saveData();
            interaction.reply("You have respawned! You have lost 50 stars.");
            return;
        } else {
            data[user.id].lastRespawn = util.getCurrentTime();
            data[user.id].health = maxHealth;
            if(data["super-mob"] && data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            saveData();
            interaction.reply("You have respawned! You can respawn again in 5 minutes.");
        }
    }, 

    generateMobs: generateMobs,
    createActionRow: createActionRow,
    createMobList: createMobList,
    createMobInfo: createMobInfo,
    handleUltraRarity: handleUltraRarity
};