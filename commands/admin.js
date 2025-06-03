// admin.js
// Handles admin commands

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
const editXP = util.editXP;
const mobStats = mobsfile.mobStats;

function checkAdmin(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
        interaction.reply("You do not have permission to use this command.");
        return false;
    }
    return true;
}

module.exports = {
    name: 'admin',
    description: 'Admin commands',
    editXP(interaction, data) {
        if (!checkAdmin(interaction)) return;

        const user = interaction.options.get('user');
        const amount = interaction.options.get('amount');
        data[user.user.id] = util.fillInProfileBlanks(data[user.user.id] || {});
        editXP(user.user.id, amount.value, data);
        interaction.reply(`Added ${amount.value} XP to ${user.user.username}. Total XP: ${data[user.user.id]["xp"]}`);
    }, 

    editStars(interaction, data) {
        if (!checkAdmin(interaction)) return;

        const user = interaction.options.get('user');
        const amount = interaction.options.get('amount');
        data[user.user.id] = util.fillInProfileBlanks(data[user.user.id] || {});
        data[user.user.id]["stars"] += amount.value;
        saveData(data);
        interaction.reply(`Added ${amount.value} stars to ${user.user.username}. Total stars: ${data[user.user.id]["stars"]}`);
    },

    addPetal(interaction, data) {
        if (!checkAdmin(interaction)) return;

        const user = interaction.options.get("user").user;
        const petal = interaction.options.get("petal").value;
        const rarity = interaction.options.get("rarity").value;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {})

        data[user.id]["inventory"][petal] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        data[user.id]["inventory"][petal][rarity] = 1; // Set the rarity to 1
        saveData(data);
        interaction.reply(`Added ${getPetalRarity(rarity)} ${getPetalType(petal)} to ${user.username}`)
    },

    removePetal(interaction, data) {
        if (!checkAdmin(interaction)) return;

        const user = interaction.options.get("user").user;
        const petal = interaction.options.get("petal").value;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {})

        if(data[user.id]["inventory"][petal] != null) {
            delete data[user.id]["inventory"][petal]
            let loadoutIDX = data[user.id]["loadout"].indexOf(petal);
            if(loadoutIDX >= 0) {
                data[user.id]["loadout"][loadoutIDX] = -1;
            }
        }
        saveData();
        interaction.reply(`Removed ${getPetalRarity(petal)} ${getPetalType(petal)} from ${user.username}`)
    },

    spawnSuper(interaction, data) {
        if (!checkAdmin(interaction)) return;
        const mob = interaction.options.get('mob');
        data["super-mob"] = {
            name: mob.value,
            health: mobStats[mob.value].health * 78125,
            damage: mobStats[mob.value].damage * 2187,
            loot: mobStats[mob.value].loot * 16384,
            damagers: {}
        }
        saveData(data);
        interaction.channel.send({
            content: `A Super ${mob.value} has spawned!\nHealth: ${data["super-mob"].health}\nDamage:${data["super-mob"].damage}\nLoot: ${data["super-mob"].loot}`,
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
        interaction.reply({
            content: "Super mob spawned.", 
            flags: MessageFlags.Ephemeral
        })
    },
    
    submitIdea(interaction, data) {
        const ideadesc = interaction.options.get("idea");

        if(!data["ideas"]) data["ideas"] = [];
        data["ideas"].push(interaction.user.username + ": " + ideadesc.value);
        saveData(data);

        interaction.reply({
            content: "Idea submitted!", 
            flags: MessageFlags.Ephemeral
        })
    }
}
