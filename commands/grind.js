const mobsfile = require('../mobs');
const constants = require('../const');
const util = require('../util');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

const saveData = util.saveData;

function generateMobs(biome, zone, rarity, userId, data) {
    let mobAmount = Math.min(Math.round(Math.random() * constants.petalLowercaseRarities.indexOf(rarity) + 2), 5);
    
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
            mobInfo[i] = handleUltraRarity(mobs[i], mob_rarity, data, interaction);
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

function handleUltraRarity(mob, rarity, data, interaction) {
    if (Math.random() < constants.rareMobSpawn) {
        if (!data["super-mob"]) {
            data["super-mob"] = {
                name: mob,
                health: mobsfile.mobStats[mob].health * 78125,
                damage: mobsfile.mobStats[mob].damage * 2187,
                loot: mobsfile.mobStats[mob].loot * 16384,
                damagers: {}
            };
            saveData(data);
            interaction.channel?.send({
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
        return null;
    }
    return createMobInfo(mob, rarity);
}

function createActionRow(mobs) {
    const row = new ActionRowBuilder();
    for (let i = 0; i < mobs.length; i++) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(i.toString())
                .setLabel(`Attack ${mobs[i]}`)
                .setStyle(ButtonStyle.Danger)
        );
    }
    return row;
}

function createMobList(mobs, mobInfo) {
    return mobs.map((mob, i) => 
        `${mobInfo[i].rarity} ${mob}: ${mobInfo[i].health} HP, ${mobInfo[i].damage} DMG`
    ).join('\n');
}

module.exports = {
    name: 'grind',
    description: 'Grind for stars',
    execute(interaction, data) {
        const biome = interaction.options.get('biome');
        const zone = mobsfile.biomes[biome.value].startingZone;
        const rarity = "common";
        const user = interaction.user;
        
        if (!data[user.id]) {
            data[user.id] = { health: 30 };
        }
        
        if (data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        const { mobs, mobInfo, mobAmount } = generateMobs(biome.value, zone, rarity, user.id, data);
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
            components: [row], 
            flags: MessageFlags.Ephemeral
        });
    },

    continueGrind(interaction, data, saveData) {
        const user = interaction.user;
        const grindInfo = data[user.id]?.["grind-info"];
        
        if (!grindInfo) {
            interaction.reply("No active grind session found.");
            return;
        }
        
        const { biome, rarity, zone } = grindInfo;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || { health: 30 });
        
        if (data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        const { mobs, mobInfo, mobAmount } = generateMobs(biome, zone, rarity, user.id, data);
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
            components: [row], 
            flags: MessageFlags.Ephemeral
        });
    },
    generateMobs: generateMobs,
    createActionRow: createActionRow,
    createMobList: createMobList,
    createMobInfo: createMobInfo,
    handleUltraRarity: handleUltraRarity
};