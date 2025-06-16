// talents.js
// Handles talents and upgrading talents

const constants = require('../const');
const util = require('../util');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const saveData = require('../util').saveData;

module.exports = {
    name: 'talents',
    execute(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        util.saveData(data);
        
        let finalText = `**Current talents**\n` + 
        `*Loadout:* Level ${data[user.id]["talents"]["loadout"]}\n` +
        `*Evasion:* Level ${data[user.id]["talents"]["evasion"]}\n` +
        `*Max HP:* Level ${data[user.id]["talents"]["max_hp"]}\n` +
        `*Rare Loot Chance:* Level ${data[user.id]["talents"]["rare_drop_rate"]}\n` +
        `*Craft Chance:* Level ${data[user.id]["talents"]["craft_chance"]}\n\nSelect a talent to upgrade:`;

        let row = new ActionRowBuilder();

        // Build buttons
        for (const talent of Object.keys(constants.talentCosts)) {
            let talentCost = constants.talentCosts[talent][data[user.id]["talents"][talent]];
            let buttonStyle = ButtonStyle.Primary;
            if(data[user.id]["stars"] < talentCost) {
                buttonStyle = ButtonStyle.Danger;
            }
            
            if(data[user.id]["talents"][talent] == constants.talentCosts[talent].length) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(talent + "-talent")
                        .setLabel(`${talent} (MAX)`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(talent + "-talent")
                        .setLabel(`${talent} (${talentCost} stars)`)
                        .setStyle(buttonStyle)
                        .setDisabled(data[user.id]["stars"] < talentCost)
                );

            }
        }

        interaction.reply({
            content: finalText, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        })
    },
    upgradeLoadoutTalent(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        let starCost = constants.talentCosts.loadout[data[user.id]["talents"]["loadout"]]
        data[user.id]["stars"] -= starCost;
        data[user.id]["talents"]["loadout"]++;
        data[user.id]["loadout"].push("-1_0");
        data[user.id]["second_loadout"].push("-1_0");
        saveData(data);
        
        interaction.update({
            content: `You have leveled up your loadout for ${starCost} stars!`, 
            components: [], 
            flags: MessageFlags.Ephemeral
        })
    },
    upgradeEvasionTalent(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        let starCost = constants.talentCosts.evasion[data[user.id]["talents"]["evasion"]]
        data[user.id]["stars"] -= starCost;
        data[user.id]["talents"]["evasion"]++;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        
        interaction.update({
            content: `You have leveled up your evasion for ${starCost} stars!`, 
            components: [], 
            flags: MessageFlags.Ephemeral
        })
    },
    upgradeHPTalent(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        let starCost = constants.talentCosts.max_hp[data[user.id]["talents"]["max_hp"]]
        data[user.id]["stars"] -= starCost;
        data[user.id]["talents"]["max_hp"]++;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        
        interaction.update({
            content: `You have leveled up your max hp for ${starCost} stars!`, 
            components: [], 
            flags: MessageFlags.Ephemeral
        })
    },
    upgradeRareLootChance(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        let starCost = constants.talentCosts.rare_drop_rate[data[user.id]["talents"]["rare_drop_rate"]]
        data[user.id]["stars"] -= starCost;
        data[user.id]["talents"]["rare_drop_rate"]++;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        
        interaction.update({
            content: `You have leveled up your chance to get rare loot for ${starCost} stars!`, 
            components: [], 
            flags: MessageFlags.Ephemeral
        })
    },
    upgradeCraftChance(interaction, data) {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        let starCost = constants.talentCosts.craft_chance[data[user.id]["talents"]["craft_chance"]]
        data[user.id]["stars"] -= starCost;
        data[user.id]["talents"]["craft_chance"]++;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData(data);
        
        interaction.update({
            content: `You have leveled up your craft chance for ${starCost} stars!`, 
            components: [], 
            flags: MessageFlags.Ephemeral
        })
    }
}
