// combat.js
// Handles combat for grinding
// called when user clicks "attack [mob]" button

const util = require('../util');
const petals = require('../petals');
const mobsfile = require('../mobs');
const constants = require('../const');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

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

module.exports = {
    name: 'combat',
    description: 'Combat',

    // Called when player attacks a normal mob
    execute(interaction, data) {
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

            // check for double damage from faster
            let doubleDamage = false;
            if(data[user.id]["loadout"].includes(9)) {
                doubleDamage = (Math.random() < (petalStats[9].rotation * (data[user.id].inventory["9"] + 1)));
            }

            // check if user has bur
            let bur = 0;
            for (const petal of data[user.id]["loadout"]) {
                if(petal.split("_")[0] == 15) {
                    bur = petalStats[15].pierce * (3 ** (petal.split("_")[1] || 0));
                    bur = Math.floor(bur);
                    break;
                }
            }

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

            // check if user has talisman
            let talismanChance = 0;
            for (const petal of data[user.id]["loadout"]) {
                if(petal.split("_")[0] == 20) {
                    talismanChance = petalStats[19].evasion + (0.1 * (parseInt(petal.split("_")[1]) || 0));
                }
            }
            
            // check all petals for dmg and heals
            for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
                for (const petal of data[user.id]["loadout"]) {
                    p_id = petal.split("_")[0];
                    if (p_id == -1) continue; // Skip if petal is -1

                    // Missile
                    if (p_id == 8) {
                        let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                        if(data[user.id]["grind-info"].mobs[mobToHit].health > 0) {
                            data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                        } else {
                            extraInfo += "\nYour Missile missed!"
                        }
                        continue;
                    }

                    // Lightning
                    if (p_id == 11) {
                        for (let mobID = 0; mobID < data[user.id]["grind-info"].mobs.length; mobID++)
                        if(data[user.id]["grind-info"].mobs[mobID].health > 0) {
                            data[user.id]["grind-info"].mobs[mobID].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                        }
                        continue;
                    }

                    // Glass
                    if (p_id == 12) {
                        let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                        if(data[user.id]["grind-info"].mobs[mobToHit].health > 0 && mobToHit != mobToAttack) {
                            data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
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

                    // Bubble
                    if (p_id == 18) {
                        if(bubbleRarity == -1) continue;
                        if(bubbleRarity < grindRarity) continue;
                        skipZone = true;
                    }

                    totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                    
                    // check mob armour
                    let mobInfo = mobStats[data[user.id]["grind-info"].mobs[mobToAttack].name]
                    if(mobInfo.armour) {
                        let mobRarity = petalRarities.indexOf(data[user.id]["grind-info"].mobs[mobToAttack].rarity)
                        let mobArmour = mobInfo.armour * (3 ** mobRarity);
                        mobArmour = Math.floor(mobArmour);
                        totalPlayerDamage -= mobArmour;
                    }
                    
                    // apply bur buff multiplied by petal count
                    totalPlayerDamage += bur * (petalStats[p_id].count || 1);

                    // heal player based on petal's heal
                    data[user.id]["health"] += petalStats[p_id].heal * (3 ** (petal.split("_")[1] || 0))
                }
            }

            // do not heal past max health
            if(data[user.id]["health"] > data[user.id]["max_health"]) {
                data[user.id]["health"] = data[user.id]["max_health"]
            }

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
                let gotRareLoot = Math.random() < constants.rareLootChance;

                // calc petal drops
                for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                    // get xp for the mob (no rare loot applied)
                    totalXP += data[user.id]["grind-info"].mobs[i].loot * (4 ** petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity));

                    let petalRolls = 1;
                    if(gotRareLoot) {
                        petalRolls = 4;
                    }
                    for(let b = 0; b < petalRolls; b++) {
                        for (const p of mobStats[data[user.id]["grind-info"].mobs[i].name].petalDrop) {
                            const randomLootDropChance = Math.random() * 2;
                            if(randomLootDropChance <= 1.0) {
                                const grindRarity = petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity);
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
                data[user.id]["stars"] = (data[user.id]["stars"] || 0) + Math.ceil(totalXP / 2);

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
                mobList += `${data[user.id]["grind-info"].mobs[i].rarity} ${data[user.id]["grind-info"].mobs[i].name}: ${data[user.id]["grind-info"].mobs[i].health.toFixed(2)} HP, ${data[user.id]["grind-info"].mobs[i].damage.toFixed(2)} DMG\n`;
            }
            interaction.update({
                content: `You are grinding in the ${biomes[data[user.id]["grind-info"].biome].name} for ${data[user.id]["grind-info"].rarity} mobs.\n**Zone: ${data[user.id]["grind-info"].zone}**${extraInfo}\nYour health: ${data[user.id].health.toFixed(2)}\nMobs: \n${mobList}`, 
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
        const totalPlayerDamage = calculatePlayerDamage(data[user.id]["loadout"]);
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
        if (!data[user.id]) {
            data[user.id] = {}
        }
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

        if(!data[user.id]["health"]) data[user.id]["health"] = 30;
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

        // check for double damage from faster
        let doubleDamage = false;
        let fasterRarity = parseInt(isPetalEquipped(9, user.id, data));
        if(fasterRarity >= 0) {
            doubleDamage = (Math.random() < (petalStats[9].rotation * (fasterRarity + 1)));
        }

        // check if user has bur
        let bur = 0;
        for (const petal of data[user.id]["loadout"]) {
            if(petal.split("_")[0] == 15) {
                bur = petalStats[15].pierce * (3 ** (petal.split("_")[1] || 0));
                bur = Math.floor(bur);
                break;
            }
        }

        // check if user has goldenleaf
        let gleafDmgIncrease = 1;
        for (const petal of data[user.id]["loadout"]) {
            if(petal.split("_")[0] == 17) {
                gleafDmgIncrease = (1.1 ** ((petal.split("_")[1]-2) || 0));
                break;
            }
        }
        
        // check all petals for dmg and heals
        for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
            for (const petal of data[user.id]["loadout"]) {
                p_id = petal.split("_")[0];
                if (p_id == -1) continue; // Skip if petal is -1

                // Stinger
                if (p_id == 16) { // 35% miss chance
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

                totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                
                // apply bur buff multiplied by petal count
                totalPlayerDamage += bur * (petalStats[p_id].count || 1);
            }
        }

        // apply dmg
        totalPlayerDamage = Math.floor(totalPlayerDamage * gleafDmgIncrease);
        saveData(data);

        interaction.update({
            content: `You are testing your loadout on a Target Dummy.\nDPH (Damage Per Hit): ${totalPlayerDamage}${extraInfo}`, 
            components: interaction.message.components, 
            flags: MessageFlags.Ephemeral
        });
    }
}
