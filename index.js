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
        const user = interaction.user;
        
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

        let row = new ActionRowBuilder();
        for (let i = 0; i < data[user.id]["loadout"].length; i++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`editloadout-${i}`)
                    .setLabel(`Slot ${i+1}`)
                    .setStyle(ButtonStyle.Primary)
            )
        }
        
        interaction.reply({
            content: `Which slot do you want to update?\n\nCurrent Loadout:\n${util.makeLoadoutText(user.id, data)}`, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        })
    }
    if (interaction.commandName === "edit_secondary_loadout") {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData();

        let row = new ActionRowBuilder();
        for (let i = 0; i < data[user.id]["second_loadout"].length; i++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`editloadout2-${i}`)
                    .setLabel(`Slot ${i+1}`)
                    .setStyle(ButtonStyle.Primary)
            )
        }
        
        interaction.reply({
            content: `Which slot in your secondary loadout do you want to update?`, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        })
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
        const petal = interaction.options.get("petal").value;
        const rarity = interaction.options.get("rarity").value;

        let statsText = "";
        for (const [stat, val] of Object.entries(petalStats[petal])) {
            if(val <= 0 && stat != "damage") continue;
            let unscaled_stats = ["rotation", "count", "smell", "evasion", "attraction", "dmg_increase"];
            // TODO fix scaling display
            if(unscaled_stats.includes(stat)) {
                statsText += `**${stat}:** ${val * (rarity + 1)}\n`
                continue;
            }
            if(Number.isFinite(parseInt(val))) {
                statsText += `**${stat}:** ${(val * (3 ** rarity)).toFixed(2)}\n`
            } else {
                statsText += `**${stat}:** ${val.toFixed(2)}\n`
            }
        }

        interaction.reply(statsText);
    }
    if (interaction.commandName === "swap_loadout_slot") {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        saveData();

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
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            const petalType = parseInt(interaction.customId.split("-")[1]);

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
                content: `What rarity to craft?\nYour stars: ${data[user.id].stars}`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId.includes("craft-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();
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
            saveData();


            if (Math.random() > petalCraftChances[currentPetalRarity]) { // failed craft
                data[user.id]["inventory"][petalType][currentPetalRarity] -= Math.ceil(Math.random() * 4);
                saveData();

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
                    content: `**Crafting failed...**\nWhat rarity to craft?\nYour stars: ${data[user.id].stars}`, 
                    components: rows, 
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            data[user.id]["inventory"][petalType][currentPetalRarity] -= 5; // success
            data[user.id]["inventory"][petalType][parseInt(currentPetalRarity) + 1] += 1;

            saveData();

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
                content: `**Crafting success!**\nWhat rarity to craft?\nYour stars: ${data[user.id].stars}`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId.includes("editloadout-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();
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
                        .setCustomId(`editslot-${slot}-${petal}`)
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
        } else if (interaction.customId.includes("editloadout2-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();
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
                        .setCustomId(`editslot2-${slot}-${petal}`)
                        .setLabel(getPetalType(petal))
                        .setStyle(ButtonStyle.Primary)
                );
                petalsSoFar++;
            }
    
            interaction.update({
                content: `Which petal do you want to put in slot ${slot+1} of your secondary loadout?`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId.includes("editslot-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();
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
                        .setCustomId(`slotpetal-${slot}-${petal}-${rarity}`)
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
        } else if (interaction.customId.includes("editslot2-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            saveData();
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
                if(data[user.id]["second_loadout"].indexOf(`${petal}_${rarity}`) >= 0) {
                    dis = true;
                    if(data[user.id]["second_loadout"].indexOf(`${petal}_${rarity}`) == slot) {
                        style = ButtonStyle.Success;
                        text += ` already in slot ${slot+1}!`;
                    } else {
                        style = ButtonStyle.Danger;
                        text += ` in another slot!`;
                    }
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`slotpetal2-${slot}-${petal}-${rarity}`)
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
        } else if (interaction.customId.includes("slotpetal")) {
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
            saveData();
            
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
        } else if (interaction.customId.includes("slotpetal2-")) {
            // This is now handled by the slotpetal- case with isSecondary fla
            interaction.update({
                content: "This interaction is outdated. Please try again.",
                flags: MessageFlags.Ephemeral
            });
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
