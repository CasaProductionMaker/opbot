const constants = require('./const')
const petals = require('./petals')
const mobs = require('./mobs')
const util = require('./util')
const profile = require('./commands/profile')
const craft = require('./commands/craft')
const talents = require('./commands/talents')
const grind = require('./commands/grind')
const respawn = require('./commands/respawn')
const combat = require('./commands/combat')
const inventory = require('./commands/inventory')
const advancerarity = require('./commands/advancerarity')
const { TOKEN, GUILD_ID, BOT_ID } = require('./config.json');
const fs = require('fs');
const dataFile = "saved_data.json";
const LoadoutHandler = require('./loadoutHandler');
let data = {};

// Get Discord js stuff
const { REST, Routes, Client, IntentsBitField, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags } = require('discord.js');
const { deserialize } = require('v8');
const { type } = require('os');
const { get } = require('http');

// Create client obj
const client = new Client({
    intents: [
        //GatewayIntentBits.Guilds,
        //GatewayIntentBits.GuildMessages,
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent, 
    ]
})
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Load game constants
const petalRarities = constants.petalRarities
const petalCraftChances =  constants.petalCraftChances;
const petalLowercaseRarities = petalRarities.map(s => s.toLowerCase());
const dropRarityChances = constants.dropRarityChances;
const petalTypes = petals.petalTypes;
const petalStats = petals.petalStats;
const biomes = mobs.biomes;
const mobStats = mobs.mobStats;
const commands = require('./commands').commands;

// functions
function editXP(user, value) {
    let xp = data[user]["xp"] || 0;
    data[user]["xp"] = xp + value;
    saveData();
}

function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
}

// Gets the petal type from a petal string. Petal string is
// "n_m" where n is the id and m is the rarity
function getPetalType(petal) {
    return petalTypes[petal];
}

// Gets the petal rarity
function getPetalRarity(petal) {
    return petalRarities[petal];
}
// Load data
if(fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile));
    console.log("Loaded saved data.");
}

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(BOT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(`Error: ${error}`);
    }
})();


client.on("ready", (c) => {
	console.log(`Logged in as ${c.user.tag}!`)
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if(message.author.id == 1151946123997618358) {
        if (message.content == "/send_embed") {
            const embed = new EmbedBuilder()
                .setTitle("This is a title")
                .setDescription("This is a description")
                .setColor("Random")
                .addFields(
                    { name: "Field 1", value: "This is field 1", inline: true },
                    { name: "Field 2", value: "This is field 2", inline: true }
                )
            
            message.reply({ embeds: [embed] });
        }
        if(message.content == "/fix_loadouts") {
            for (const user in data) {
                if(!data[user]) continue;
                
                data[user]["loadout"].push(-1);
                data[user]["loadout"].push(-1);
            }
            saveData();
            message.reply("Fixed P2AHs bad loadout system...");
        }
        if(message.content == "/fix_inventory_data") {
            for (const user in data) {
                if(!data[user]) continue;
                
                if(!data[user]["inventory"]) {
                    data[user]["inventory"] = {};
                }
                if(user == "1151946123997618358" || user == "super-mob" || user == "ideas") continue;
                
                for (const petal in data[user]["loadout"]) {
                    let petalID = data[user]["loadout"][petal];
                    if (petalID == -1) {
                        data[user]["loadout"][petal] = "-1_0";
                        continue;
                    }
                    let rarityID = data[user]["inventory"][petalID];

                    data[user]["loadout"][petal] = `${petalID}_${rarityID}`;
                }

                for (const petal in data[user]["inventory"]) {
                    let rarityID = data[user]["inventory"][petal];
                    data[user]["inventory"][petal] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                    data[user]["inventory"][petal][rarityID] = 1; // Set the rarity to 1
                }
            }
            saveData();
            message.reply("Fixed Farts Ant Hell's bad inventory data.");
        }
    }
});

client.on('interactionCreate', (interaction) => {
    // Admin only commands
    if (interaction.commandName === 'xp_edit') {
        if (!interaction.member.permissions.has("Administrator")) {
            interaction.reply("You do not have permission to use this command.");
            return;
        }
        const user = interaction.options.get('user');
        const amount = interaction.options.get('amount');
        data[user.user.id] = util.fillInProfileBlanks(data[user.user.id] || {});
        editXP(user.user.id, amount.value);
        interaction.reply(`Added ${amount.value} XP to ${user.user.username}. Total XP: ${data[user.user.id]["xp"]}`);
    }
    if (interaction.commandName === 'stars_edit') {
        if (!interaction.member.permissions.has("Administrator")) {
            interaction.reply("You do not have permission to use this command.");
            return;
        }
        const user = interaction.options.get('user');
        const amount = interaction.options.get('amount');
        data[user.user.id] = util.fillInProfileBlanks(data[user.user.id] || {});
        data[user.user.id]["stars"] += amount.value;
        saveData();
        interaction.reply(`Added ${amount.value} stars to ${user.user.username}. Total stars: ${data[user.user.id]["stars"]}`);
    }
    if (interaction.commandName === "add_petal") {
        if(!interaction.member.permissions.has("Administrator"))
        {
            interaction.reply("You do not have permission to use this command.");
            return;
        }
        const user = interaction.options.get("user").user;
        const petal = interaction.options.get("petal").value;
        const rarity = interaction.options.get("rarity").value;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {})

        data[user.id]["inventory"][petal] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        data[user.id]["inventory"][petal][rarity] = 1; // Set the rarity to 1
        saveData();
        interaction.reply(`Added ${petalRarities[rarity]} ${petalTypes[petal]} to ${user.username}`)
    }
    if (interaction.commandName === "remove_petal") {
        if(!interaction.member.permissions.has("Administrator"))
        {
            interaction.reply("You do not have permission to use this command.");
            return;
        }
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
        interaction.reply(`Removed ${petalTypes[petal]} from ${user.username}`)
    }
    if (interaction.commandName === 'spawn_super') {
        const user = interaction.user;
        if(!interaction.member.permissions.has("Administrator"))
        {
            interaction.reply("You do not have permission to use this command.");
            return;
        }
        const mob = interaction.options.get('mob');
        data["super-mob"] = {
            name: mob.value,
            health: mobStats[mob.value].health * 78125,
            damage: mobStats[mob.value].damage * 2187,
            loot: mobStats[mob.value].loot * 16384,
            damagers: {}
        }
        saveData();
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
    }

    // Normal commands
    if (interaction.commandName === 'craft_petal') {
        craft.execute(interaction, data);
    }
    // Upgrade talents command
    if (interaction.commandName === 'upgrade_talents') {
        talents.execute(interaction, data);
    }
    if (interaction.commandName === 'grind') {
        grind.execute(interaction, data);
    }
    if (interaction.commandName === 'loadout') {
        profile.execute(interaction, data, saveData, true);
    }
    if (interaction.commandName === 'profile') { 
        profile.execute(interaction, data, saveData);
    }
    if (interaction.commandName === 'respawn') {
        respawn.execute(interaction, data, saveData);
    }
    if (interaction.commandName === "edit_loadout") {
        inventory.editLoadout(interaction, data, false);
    }
    if (interaction.commandName === "edit_secondary_loadout") {
        inventory.editLoadout(interaction, data, true);
    }
    if (interaction.commandName === 'help') {
        let commandList = "";
        for (let i = 0; i < commands.length; i++) {
            commandList += `/${commands[i].name} - ${commands[i].description}\n`;
        }
        interaction.reply({
            content: `**List of commands:**\n${commandList}`,
            flags: MessageFlags.Ephemeral
        });
    }
    if (interaction.commandName === "submit_idea") {
        const ideadesc = interaction.options.get("idea");

        data["ideas"].push(interaction.user.username + ": " + ideadesc.value);
        saveData();

        interaction.reply({
            content: "Idea submitted!", 
            flags: MessageFlags.Ephemeral
        })
    }
    if (interaction.commandName === "petal_stats") {
        petals.showPetalStats(interaction);
    }
    if (interaction.commandName === "swap_loadout_slot") {
        inventory.swapLoadoutSlot(interaction, data);
    }
    if (interaction.commandName === "visit_target_dummy") {
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
        saveData();

        interaction.reply({
            content: `You are testing your loadout on a Target Dummy.\nDPH (Damage Per Hit): 0`, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        });
    }

    if (interaction.isButton()) {
        // super mobs to fix
        if (interaction.customId === "super-mob") {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {})
            saveData();
            if(data[user.id]["health"] <= 0) {
                interaction.reply({content: "You are dead! Use /respawn to respawn.", flags: MessageFlags.Ephemeral});
                return;
            }
            if(!data["super-mob"]) {
                interaction.reply("The Super is already dead!");
                return;
            }
            const mob = data["super-mob"].name;
            if(!data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            let totalPlayerDamage = 0;
            for (const petal of data[user.id]["loadout"]) {
                if (petal == -1) continue; // Skip if petal is -1
                totalPlayerDamage += petalStats[petal].damage * (3 ** (data[user.id]["inventory"][petal] || 0));
            }
            data["super-mob"].damagers[user.id] += totalPlayerDamage;
            data["super-mob"].health -= totalPlayerDamage;
            saveData();
            if(Math.random() < 0.01) {
                // Player gets hit by the mob
                data[user.id]["health"] -= data["super-mob"].damage;
                saveData();
            }
            if(data["super-mob"].health <= 0) {
                // mob has died so give loot to damagers based off damage dealt
                let totalLoot = data["super-mob"].loot;
                let allLooters = {};
                for (const damager in data["super-mob"].damagers) {
                    let loot = Math.floor((data["super-mob"].damagers[damager] / (mobStats[data["super-mob"].name].health * 2187)) * totalLoot);
                    allLooters[damager] = loot;
                    data[damager]["xp"] = (data[damager]["xp"] || 0) + loot;
                    data[damager]["stars"] = (data[damager]["stars"] || 0) + Math.ceil(loot / 2);
                }
                delete data["super-mob"];
                saveData();
                let lootList = "";
                for (const damager in allLooters) {
                    lootList += `<@${damager}>: ${allLooters[damager]} XP, ${Math.ceil(allLooters[damager] / 2)} stars\n`;
                }
                interaction.update({
                    content: `The Super ${mob} has been defeated!\n**Loot distribution:** \n ${lootList}`, 
                    components: [], 
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            interaction.update({
                content: `A Super ${data["super-mob"].name} has spawned!\nLast damager: <@${user.id}>\nHealth: ${data["super-mob"].health}\nDamage:${data["super-mob"].damage}\nLoot: ${data["super-mob"].loot}`
            })
        } else if (Number.isInteger(parseInt(interaction.customId))) {
            combat.execute(interaction, data);
        } else if (interaction.customId === "attack-dummy") {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();

            // calculate petal dmg
            let totalPlayerDamage = 0;
            let extraInfo = "";

            // check for double damage from faster
            let doubleDamage = false;
            let fasterRarity = parseInt(isPetalEquipped(9, user.id));
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
            saveData();

            interaction.update({
                content: `You are testing your loadout on a Target Dummy.\nDPH (Damage Per Hit): ${totalPlayerDamage}${extraInfo}`, 
                components: interaction.message.components, 
                flags: MessageFlags.Ephemeral
            });
        } else if (interaction.customId === "continue-grind") {
            grind.continueGrind(interaction, data, saveData);
        } else if (interaction.customId.includes("higher-rarity-")) {
            advancerarity.execute(interaction, data);
        } else if (interaction.customId.includes("craftpetal-")) {
            craft.displayCrafts(interaction, data);
        } else if (interaction.customId.includes("craft-")) {
            craft.attemptCraft(interaction, data);
        } else if (interaction.customId.includes("editloadout-")) {
            inventory.editLoadoutSlot(interaction, data, false);
        } else if (interaction.customId.includes("editloadout2-")) {
            inventory.editLoadoutSlot(interaction, data, true);
        } else if (interaction.customId.includes("editslot-")) {
            inventory.selectPetalRarity(interaction, data, false);
        } else if (interaction.customId.includes("editslot2-")) {
            inventory.selectPetalRarity(interaction, data, true);
        } else if (interaction.customId.includes("slotpetal")) {
            inventory.slotPetal(interaction, data);
        } else if (interaction.customId === 'loadout-talent') {
            talents.upgradeLoadoutTalent(interaction, data);
        } else if (interaction.customId === 'max_hp-talent') {
            talents.upgradeHPTalent(interaction, data);
        } else if (interaction.customId.includes("swappetal-")) {
            inventory.swapPetal(interaction, data);
        }
    }
});

client.login(TOKEN);
