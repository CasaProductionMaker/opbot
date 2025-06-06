// inventory.js
// Handles inventory and loadouts
// called when user clicks "inventory" button

const util = require('../util');
const petals = require('../petals');
const mobsfile = require('../mobs');
const constants = require('../const');
const LoadoutHandler = require('../loadoutHandler');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

const petalTypes = petals.petalTypes;
const saveData = util.saveData;
const fillInProfileBlanks = util.fillInProfileBlanks;
const makeLoadoutText = util.makeLoadoutText;
const getPetalType = util.getPetalType;
const getPetalRarity = util.getPetalRarity;

module.exports = {
    name: 'inventory',
    description: 'Inventory',

    // swap between loadout and secondary loadout
    swapLoadoutSlot(interaction, data) {
        const user = interaction.user;
        data[user.id] = fillInProfileBlanks(data[user.id] || {});
        saveData(data);

        // generate buttons
        const row = new ActionRowBuilder();
        for (let i = 0; i < data[user.id]["loadout"].length; i++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`swappetal-${i}`)
                    .setLabel(`Slot ${i+1}`)
                    .setStyle(ButtonStyle.Primary)
            )
        }
        interaction.reply({
            content: `Which slot do you want to swap?`,
            components: [row],
            flags: MessageFlags.Ephemeral
        })
    },

    selectPetalRarity(interaction, data, secondary = false) {
        
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        const slot = parseInt(interaction.customId.split("-")[1]);
        const petal = interaction.customId.split("-")[2];

        let rows = [];
        let petalsSoFar = 0;
        for (const rarity in data[user.id]["inventory"][petal]) {
            console.log("Petal", rarity);
            if(data[user.id]["inventory"][petal][rarity] <= 0) continue; // skip if no petals of this rarity
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }

            let style = ButtonStyle.Primary;
            let text = `${getPetalRarity(rarity)} ${getPetalType(petal)}`;
            let dis = false;
            if(data[user.id]["loadout"].indexOf(`${petal}_${rarity}`) >= 0) {
                dis = true;
                if(data[user.id]["loadout"].indexOf(`${petal}_${rarity}`) == slot) {
                    style = ButtonStyle.Success;
                    text += ` already in slot ${slot+1}!`;
                } else {
                    style = ButtonStyle.Danger;
                    text += ` in another slot!`;
                }
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`slotpetal${secondary ? "2" : ""}-${slot}-${petal}-${rarity}`)
                    .setLabel(text)
                    .setStyle(style)
                    .setDisabled(dis)
            );
            petalsSoFar++;
        }

        // Special msg if no petals left in inventory
        if (petalsSoFar == 0) {
            interaction.update({
                content: `You have no ${petalTypes[petal]} left in your inventory!`, 
                components: [], 
                flags: MessageFlags.Ephemeral
            })
            return;
        }

        interaction.update({
            content: `Which ${petalTypes[petal]} do you want to put in slot ${slot+1}?`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },

    // Choose which slot to edit
    editLoadout(interaction, data, secondary = false) {
        const user = interaction.user;
        
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let buttonsSoFar = 0;
        for (let i = 0; i < data[user.id][secondary ? "second_loadout" : "loadout"].length; i++) {
            
            // build petals
            if(buttonsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }

            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`editloadout${secondary ? "2" : ""}-${i}`)
                    .setLabel(`Slot ${i+1}`)
                    .setStyle(ButtonStyle.Primary)
            );
            buttonsSoFar++;
        }
        
        interaction.reply({
            content: `Which slot do you want to update?\n\nCurrent Loadout:\n${util.makeLoadoutText(user.id, data, secondary)}`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },

    // Choose which petal to put in the slot
    editLoadoutSlot(interaction, data, secondary = false) {
        
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        const slot = parseInt(interaction.customId.split("-")[1]);

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            // skip if no petals of this type. Use reduce to calculate sum
            if(data[user.id]["inventory"][petal].reduce((a, b) => a + b, 0) == 0) continue;
            
            // build petals
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }

            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`editslot${secondary ? "2" : ""}-${slot}-${petal}`)
                    .setLabel(getPetalType(petal))
                    .setStyle(ButtonStyle.Primary)
            );
            petalsSoFar++;
        }

        interaction.update({
            content: `Which petal do you want to put in slot ${slot+1}?`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    },

    // Do the swapping between loadout and secondary loadout
    swapPetal(interaction, data) {
        
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        const slot = parseInt(interaction.customId.split("-")[1]);

        // swap petals
        let petal1 = data[user.id]["loadout"][slot];
        let petal2 = data[user.id]["second_loadout"][slot];
        data[user.id]["loadout"][slot] = petal2;
        data[user.id]["second_loadout"][slot] = petal1;
        saveData(data);

        // create loadout text
        let loadoutText = makeLoadoutText(user.id, data);
        let secondaryLoadoutText = makeLoadoutText(user.id, data, true);

        interaction.reply({
            content: `Swapped loadout slot ${slot + 1} with secondary loadout slot ${slot + 1}.\n**Loadout:**\n${loadoutText}\n**Secondary Loadout:**\n${secondaryLoadoutText}`, 
            flags: MessageFlags.Ephemeral
        });
    }, 

    // Equip petal, send active one back to inventory
    slotPetal(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        const slotID = parseInt(interaction.customId.split("-")[1]);
        const petalToSlotIn = interaction.customId.split("-")[2];
        const petalRarity = parseInt(interaction.customId.split("-")[3]);
        const isSecondary = interaction.customId.startsWith("slotpetal2-");
        const loadoutType = isSecondary ? "second_loadout" : "loadout";

        // Handle petal equipping
        const { updatedData, success, alreadyEquipped } = LoadoutHandler.equipPetal(
            data[user.id], 
            loadoutType, 
            slotID, 
            petalToSlotIn, 
            petalRarity
        );
        
        // Update the data
        data[user.id] = updatedData;
        saveData(data);
        
        // Create petal selection buttons
        const rows = LoadoutHandler.createPetalButtons(
            data[user.id],
            loadoutType,
            slotID,
            petalToSlotIn
        );
        
        // Count available petals
        const petalsAvailable = rows.reduce((count, row) => count + row.components.length, 0);
        
        // Get response message
        const response = LoadoutHandler.getResponseMessage(
            success,
            alreadyEquipped,
            petalTypes[petalToSlotIn],
            slotID,
            loadoutType,
            petalsAvailable
        );
        
        // Add loadout text if not an error case
        if (!alreadyEquipped && petalsAvailable > 0) {
            const loadoutText = util.makeLoadoutText(user.id, data, isSecondary);
            response.content = `**New ${isSecondary ? 'secondary ' : ''}loadout:**\n${loadoutText}\n${response.content}`;
        }
        
        // Update the interaction
        interaction.update({
            content: response.content,
            components: rows.length > 0 ? rows : response.components,
            flags: MessageFlags.Ephemeral
        });
    }, 

    profile(interaction, data, saveData, onlyLoadout = false) {
        
        const inter = interaction.options.get('user') || interaction;
        data[inter.user.id] = util.fillInProfileBlanks(data[inter.user.id] || {});
        saveData();
        
        // print general stats
        let xp = data[inter.user.id].xp;
        let stars = data[inter.user.id].stars;
        let level = data[inter.user.id].level;
        let maxHealth = data[inter.user.id].max_health;
        let health = data[inter.user.id].health != null ? data[inter.user.id].health : maxHealth;

        // print loadout
        let loadoutText = util.makeLoadoutText(inter.user.id, data);
        let secondaryLoadoutText = util.makeLoadoutText(inter.user.id, data, true);

        // print final text
        let finalText = ""
        if(onlyLoadout) {
            finalText = `**Current Loadout:**\n${loadoutText}\n**Secondary Loadout:**\n${secondaryLoadoutText}`;
        } else {
            finalText = `**Profile of ${inter.user.username}**\nLevel ${level}, XP: ${xp}\nStars: ${stars}\nHealth: ${health}/${maxHealth}\n**Current Loadout:**\n${loadoutText}\n**Secondary Loadout:**\n${secondaryLoadoutText}`;
        }
    
        interaction.reply({
            content: finalText
        });
    }, 
    inventory(interaction, data, saveData) {
        const inter = interaction.options.get('user') || interaction;
        data[inter.user.id] = util.fillInProfileBlanks(data[inter.user.id] || {});
        saveData();
        
        // inventory text
        let invText = "";
        for(const petal in data[inter.user.id].inventory) {
            invText += util.petalToText(petal, inter, data);
        }

        // print final text
        let finalText = ""
        finalText = `**Inventory**\n${invText}`;
    
        interaction.reply({
            content: finalText, 
            flags: MessageFlags.Ephemeral
        });
    }
}

