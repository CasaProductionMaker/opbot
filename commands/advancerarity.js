// advancerarity.js
// Handles zones for when advancing. Maybe can combine this with grind.js

const mobsfile = require('../mobs');
const constants = require('../const');
const util = require('../util');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

// Import shared functions from grind.js
const {
    generateMobs,
    createActionRow,
    createMobList,
    createMobInfo,
    handleUltraRarity
} = require('./grind');

module.exports = {
    name: 'advancerarity',
    description: 'Advances your rarity',
    execute(interaction, data, client) {
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
        data[user.id] = util.fillInProfileBlanks(data[user.id] || { health: 30 });
        
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
    }
};