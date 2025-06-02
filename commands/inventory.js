// inventory.js
// Handles inventory and loadouts
// called when user clicks "inventory" button

const util = require('../util');
const petals = require('../petals');
const mobsfile = require('../mobs');
const constants = require('../const');
const LoadoutHandler = require('../loadoutHandler');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

const petalStats = petals.petalStats;
const mobStats = mobsfile.mobStats;
const petalRarities = constants.petalRarities;
const petalLowercaseRarities = constants.petalLowercaseRarities;
const biomes = mobsfile.biomes;
const dropRarityChances = constants.dropRarityChances;
const getPetalRarity = util.getPetalRarity;
const getPetalType = util.getPetalType;
const saveData = util.saveData;
const makeLoadoutText = util.makeLoadoutText;

module.exports = {
    name: 'inventory',
    description: 'Inventory',
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
    }
}

