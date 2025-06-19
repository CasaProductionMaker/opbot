// craft.js
// Handles crafting
// called when user clicks "craft [petal]" button
const util = require('../util');
const constants = require('../const');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

const petalRarities = constants.petalRarities;
const getPetalRarity = util.getPetalRarity;
const getPetalType = util.getPetalType;
const saveData = util.saveData;
const fillInProfileBlanks = util.fillInProfileBlanks;
const petalCraftChances = constants.petalCraftChances;

// +10% per talent upgrade, multiplicative.
// So with 1 upgrade, rare -> epic would be 16% -> 16 + 1.6 = 17.6%
function getCraftChance(rarity, interaction, data) {
    let craftChance = petalCraftChances[rarity];
    let craftUpgrades = data[interaction.user.id]["talents"]["craft_chance"];
    return craftChance * (1+(craftUpgrades/10));
}

module.exports = {
    name: 'craft',
    description: 'Crafts a petal',

    // Start crafting dialogue
    execute(interaction, data) {
        const user = interaction.user;
        data[user.id] = fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craftpetal-${petal}`)
                    .setLabel(`${getPetalType(petal)}`)
                    .setStyle(ButtonStyle.Primary)
            );
            petalsSoFar++;
        }

        interaction.reply({
            content: `Select a petal to craft.`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },
    
    // Attempt a craft
    attemptCraft(interaction, data) {
        
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        const petalType = interaction.customId.split("-")[1];
        const currentPetalRarity = interaction.customId.split("-")[2];

        if(currentPetalRarity >= petalRarities.length - 1) {
            interaction.reply("You have already reached the max rarity.");
            return;
        }
        let reqirement = util.getCraftCost(currentPetalRarity);
        if(data[user.id]["stars"] < reqirement) {
            interaction.reply("You need at least " + reqirement + " stars to attempt to craft a petal.");
            return;
        }

        data[user.id]["stars"] -= reqirement;
        saveData(data);


        if (Math.random() > getCraftChance(currentPetalRarity, interaction, data)) { // failed craft
            data[user.id]["inventory"][petalType][currentPetalRarity] -= Math.ceil(Math.random() * 4);
            saveData(data);

            let rows = [];
            let petalsSoFar = 0;
            for (const rarity in data[user.id]["inventory"][petalType]) {
                if(rarity >= 7) continue; // skip super and above
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                let style = ButtonStyle.Primary;
                if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                    style = ButtonStyle.Danger;
                } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                    style = ButtonStyle.Secondary;
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`craft-${petalType}-${rarity}`)
                        .setLabel(`${data[user.id]["inventory"][petalType][rarity]}x ${getPetalRarity(rarity)} ${getPetalType(petalType)} (${util.getCraftCost(rarity)} stars)`)
                        .setStyle(style)
                        .setDisabled(style !== ButtonStyle.Primary)
                );
                petalsSoFar++;
                if(rarity == currentPetalRarity) {
                    if(petalsSoFar % 5 == 0) {
                        rows.push(new ActionRowBuilder());
                    }
                    let style = ButtonStyle.Primary;
                    if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                        style = ButtonStyle.Danger;
                    } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                        style = ButtonStyle.Secondary;
                    }
                    rows[rows.length - 1].addComponents(
                        new ButtonBuilder()
                            .setCustomId(`megacraft-${petalType}-${rarity}`)
                            .setLabel(`Craft All ${data[user.id]["inventory"][petalType][rarity]} ${getPetalRarity(rarity)} ${getPetalType(petalType)}s`)
                            .setStyle(style)
                            .setDisabled(style !== ButtonStyle.Primary)
                    );
                    petalsSoFar++;
                }
            }
            interaction.update({
                content: `**Crafting failed...**\nWhat rarity to craft?\nYour stars: ${data[user.id].stars}`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
            return;
        }

        data[user.id]["inventory"][petalType][currentPetalRarity] -= 5; // success
        data[user.id]["inventory"][petalType][parseInt(currentPetalRarity) + 1] += 1;

        saveData(data);

        let rows = [];
        let petalsSoFar = 0;
        for (const rarity in data[user.id]["inventory"][petalType]) {
            if(rarity >= 7) continue; // skip super and above
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            let style = ButtonStyle.Primary;
            if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                style = ButtonStyle.Danger;
            } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                style = ButtonStyle.Secondary;
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craft-${petalType}-${rarity}`)
                    .setLabel(`${data[user.id]["inventory"][petalType][rarity]}x ${getPetalRarity(rarity)} ${getPetalType(petalType)} (${util.getCraftCost(rarity)} stars)`)
                    .setStyle(style)
                    .setDisabled(style !== ButtonStyle.Primary)
            );
            petalsSoFar++;
            if(rarity == currentPetalRarity) {
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                let style = ButtonStyle.Primary;
                if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                    style = ButtonStyle.Danger;
                } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                    style = ButtonStyle.Secondary;
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`megacraft-${petalType}-${rarity}`)
                        .setLabel(`Craft All ${data[user.id]["inventory"][petalType][rarity]} ${getPetalRarity(rarity)} ${getPetalType(petalType)}s`)
                        .setStyle(style)
                        .setDisabled(style !== ButtonStyle.Primary)
                );
                petalsSoFar++;
            }
        }
        interaction.update({
            content: `**Crafting success!**\nWhat rarity to craft?\nYour stars: ${data[user.id].stars}`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },

    // Attempt a megacraft
    attemptMegaCraft(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        const petalType = interaction.customId.split("-")[1];
        const currentPetalRarity = interaction.customId.split("-")[2];

        let reqirement = util.getCraftCost(currentPetalRarity);
        let totalGain = 0

        while(data[user.id]["inventory"][petalType][currentPetalRarity] >= 5 && data[user.id]["stars"] >= reqirement) {
            data[user.id]["stars"] -= reqirement;
            saveData(data);
            
            if (Math.random() > getCraftChance(currentPetalRarity, interaction, data)) { // failed craft
                data[user.id]["inventory"][petalType][currentPetalRarity] -= Math.ceil(Math.random() * 4);
            } else {
                data[user.id]["inventory"][petalType][currentPetalRarity] -= 5; // success
                data[user.id]["inventory"][petalType][parseInt(currentPetalRarity) + 1] += 1;
                totalGain++
            }
            saveData(data);
        }

        let rows = [];
        let petalsSoFar = 0;
        for (const rarity in data[user.id]["inventory"][petalType]) {
            if(rarity >= 7) continue; // skip super and above
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            let style = ButtonStyle.Primary;
            if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                style = ButtonStyle.Danger;
            } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                style = ButtonStyle.Secondary;
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craft-${petalType}-${rarity}`)
                    .setLabel(`${data[user.id]["inventory"][petalType][rarity]}x ${getPetalRarity(rarity)} ${getPetalType(petalType)} (${util.getCraftCost(rarity)} stars)`)
                    .setStyle(style)
                    .setDisabled(style !== ButtonStyle.Primary)
            );
            petalsSoFar++;
        }
        interaction.update({
            content: `**You have crafted all you could! Total petals gained: ${totalGain}**\nYour stars: ${data[user.id].stars}`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },

    // Display available crafts
    displayCrafts(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        const petalType = interaction.options.get("petal").value;

        let rows = [];
        let petalsSoFar = 0;
        for (const rarity in data[user.id]["inventory"][petalType]) {
            if(rarity >= 7) continue; // skip super and above
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            let style = ButtonStyle.Primary;
            if(data[user.id]["inventory"][petalType][rarity] <= 0) {
                style = ButtonStyle.Danger;
            } else if(data[user.id]["inventory"][petalType][rarity] < 5) {
                style = ButtonStyle.Secondary;
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craft-${petalType}-${rarity}`)
                    .setLabel(`${data[user.id]["inventory"][petalType][rarity]}x ${getPetalRarity(rarity)} ${getPetalType(petalType)} (${util.getCraftCost(rarity)} stars)`)
                    .setStyle(style)
                    .setDisabled(style !== ButtonStyle.Primary)
            );
            petalsSoFar++;
        }
        interaction.reply({
            content: `What rarity to craft?\nYour stars: ${data[user.id].stars}`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    }
}   