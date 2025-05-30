const constants = require('./const')
const petals = require('./petals')
const mobs = require('./mobs')
const util = require('./util')
const { TOKEN, GUILD_ID, BOT_ID } = require('./config.json');
const fs = require('fs');
const dataFile = "saved_data.json";
let data = {};

// Get Discord js stuff
const { REST, Routes, Client, IntentsBitField, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags } = require('discord.js');
const { deserialize } = require('v8');
const { type } = require('os');

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
    return petalTypes[petal.split("_")[0]];
}

// Gets the petal rarity
function getPetalRarity(petal) {
    return petalRarities[petal.split("_")[1]];
}

// Gets the petal dmg
function getPetalDamage(petal) {
    return petalStats[petal.split("_")[0]].damage * (3 ** petal.split("_")[1]);
}

// Returns a string of the petal, like "Common Light (2 Damage): 5x"
function petalToText(petal, inter, includeNumber = true) {
    let number = data[inter.user.id].inventory[petal];
    let petalType = getPetalType(petal);
    let petalRarity = getPetalRarity(petal);
    let petalDamageValue = getPetalDamage(petal);
    return `- ${petalRarity} ${petalType} (${petalDamageValue} Damage)${includeNumber ? ": " + number + "x" : ""}\n`;
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
    }
});

client.on('interactionCreate', (interaction) => {
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
    if (interaction.commandName === 'craft_petal') {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craft-${petal}`)
                    .setLabel(`${getPetalRarity(petal)} ${getPetalType(petal)} (${util.getCraftCost(petal.split("_")[1])} stars)`)
                    .setStyle(ButtonStyle.Primary)
            );
            petalsSoFar++;
        }

        interaction.reply({
            content: `Select a petal to craft.\nYour stars: ${data[user.id].stars}`, 
            components: rows, 
            flags: MessageFlags.Ephemeral
        })
    }
    if (interaction.commandName === 'grind') {
        const biome = interaction.options.get('biome');
        const rarity = "common";
        const user = interaction.user;
        if (!data[user.id]) {
            data[user.id] = {}
        }
        if(data[user.id]["health"] <= 0) {
            interaction.reply("You are dead! You cannot grind.");
            return;
        }

        let mobAmount = Math.min(Math.round(Math.random() * petalLowercaseRarities.indexOf(rarity) + 2), 5);
        let mobs = [];
        for (let i = 0; i < mobAmount; i++) {
            let randomID = Math.floor(Math.random() * biomes[biome.value].mobs.length);
            let mob = biomes[biome.value].mobs[randomID];
            if (mobStats[mob].reroll) {
                mob = biomes[biome.value].mobs[Math.floor(Math.random() * biomes[biome.value].mobs.length)];
            }
            mobs.push(mob);
        }
        let mobInfo = [];
        for (let i = 0; i < mobs.length; i++) {
            mobInfo[i] = {
                name: mobs[i],
                loot: mobStats[mobs[i]].loot,
                rarity: petalRarities[petalLowercaseRarities.indexOf(rarity)], 
                health: mobStats[mobs[i]].health * (5 ** petalLowercaseRarities.indexOf(rarity)), 
                damage: mobStats[mobs[i]].damage * (3 ** petalLowercaseRarities.indexOf(rarity)), 
                dead: false
            }
        }

        const row = new ActionRowBuilder();
        for (let i = 0; i < mobs.length; i++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(i.toString())
                    .setLabel(`Attack ${mobs[i]}`)
                    .setStyle(ButtonStyle.Danger)
            )
        }
        
        data[user.id]["grind-info"] = {
            biome: biome.value,
            rarity: rarity, 
            mobs: mobInfo, 
            messageID: interaction.id, 
            mobsLeft: mobAmount
        }
        if(!data[user.id]["health"]) data[user.id]["health"] = 30;
        saveData();
        
        let mobList = "";
        for (let i = 0; i < mobs.length; i++) {
            mobList += `${mobInfo[i].rarity} ${mobs[i]}: ${mobInfo[i].health} HP, ${mobInfo[i].damage} DMG\n`;
        }

        interaction.reply({
            content: `You are grinding in the ${biomes[biome.value].name} for ${rarity} mobs.\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
            components: [row], 
            flags: MessageFlags.Ephemeral
        });
    }
    if (interaction.commandName === 'profile') { // Profile command
        const inter = interaction.options.get('user') || interaction;
        data[inter.user.id] = util.fillInProfileBlanks(data[inter.user.id] || {});
        saveData();
        
        // print general stats
        let xp = data[inter.user.id].xp;
        let stars = data[inter.user.id].stars;
        let level = data[inter.user.id].level;
        let maxHealth = data[inter.user.id].max_health;
        let health = data[inter.user.id].health != null ? data[inter.user.id].health : maxHealth;
        let inventoryText = "";

        // print inventory
        for (const petal in data[inter.user.id].inventory) {
            inventoryText += petalToText(petal, inter);
        }

        // print loadout
        let loadoutText = "";
        for (const i in data[inter.user.id].loadout) {
            const petal = data[inter.user.id].loadout[i];
            if (petal.split("_")[0] == "-1") {
                loadoutText += `- Empty Slot!\n`;
                continue;
            }
            loadoutText += petalToText(petal, inter, false);
        }

        // print final text
        let finalText = `**Profile of ${inter.user.username}**\nLevel ${level}, XP: ${xp}\nStars: ${stars}\nHealth: ${health}/${maxHealth}\n**Inventory:**\n${inventoryText}**Current Loadout:**\n${loadoutText}`;
        interaction.reply({
            content: finalText
        });
    }
    if (interaction.commandName === 'respawn') {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {})
        if(data[user.id]["health"] > 0) {
            interaction.reply("You are not dead! You cannot respawn.");
            return;
        }
        if(!data[user.id].lastRespawn) {
            data[user.id].lastRespawn = 0;
        }

        let maxHealth = data[user.id]["max_health"];
        if (util.getCurrentTime() - data[user.id].lastRespawn < 300000) {
            if(data[user.id]["stars"] < 50) {
                interaction.reply(`You are on cooldown! You can respawn in ${Math.ceil(5 - ((util.getCurrentTime() - data[user.id].lastRespawn) / 60000))} minutes or once you have 50 stars.`);
                return;
            }
            data[user.id].lastRespawn = util.getCurrentTime();
            data[user.id].health = maxHealth;
            data[user.id]["stars"] -= 50;
            if(data["super-mob"] && data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            saveData();
            interaction.reply("You have respawned! You have lost 50 stars.");
            return;
        } else {
            data[user.id].lastRespawn = util.getCurrentTime();
            data[user.id].health = maxHealth;
            if(data["super-mob"] && data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            saveData();
            interaction.reply("You have respawned! You can respawn again in 5 minutes.");
        }
    }
    if (interaction.commandName === "edit_slot") {
        const user = interaction.user;
        const slot = interaction.options.get("slot").value;
        
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            console.log("Petal", petal);
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            let style = ButtonStyle.Primary;
            let text = `${getPetalRarity(petal)} ${getPetalType(petal)}`;
            let dis = false;
            if(data[user.id]["loadout"].indexOf(petal) >= 0) {
                dis = true;
                if(data[user.id]["loadout"].indexOf(petal) == slot) {
                    style = ButtonStyle.Success;
                    text += ` already in slot ${slot+1}!`;
                } else {
                    style = ButtonStyle.Danger;
                    text += ` in another slot!`;
                }
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`editslot-${slot}-${petal}`)
                    .setLabel(text)
                    .setStyle(style)
                    .setDisabled(dis)
            );
            petalsSoFar++;
        }

        interaction.reply({
            content: `Which petal do you want to put in slot ${slot+1}?`, 
            components: rows, 
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

        data[user.id]["inventory"][petal] = rarity;
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
    if (interaction.commandName == "petal_stats") {
        const petal = interaction.options.get("petal").value;
        const rarity = interaction.options.get("rarity").value;

        let statsText = "";
        for (const [stat, val] of Object.entries(petalStats[petal])) {
            if(val <= 0 && stat != "damage") continue;
            if(stat == "rotation") {
                statsText += `**${stat}:** ${val * rarity}\n`
                continue;
            }
            if(Number.isFinite(parseInt(val))) {
                statsText += `**${stat}:** ${val * (3 ** rarity)}\n`
            } else {
                statsText += `**${stat}:** ${val}\n`
            }
        }

        interaction.reply(statsText);
    }

    if (interaction.isButton()) {
        // super mobs to fix
        if (interaction.customId === "super-mob") {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {})
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
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            let mobToAttack = interaction.customId;

            if(!data[user.id]["grind-info"]) {
                interaction.reply("You are not grinding! Use /grind to start grinding.");
                return;
            }
            if(!data[user.id]["grind-info"].mobs[mobToAttack]) {
                interaction.reply("Woah that was too fast for my code :skull:");
                return;
            }

            if(data[user.id]["grind-info"].mobs[mobToAttack].health > 0) {
                let totalPlayerDamage = 0;
                let extraInfo = "";
                let doubleDamage = false;
                if(data[user.id]["loadout"].includes(9)) {
                    doubleDamage = (Math.random() < (petalStats[9].rotation * data[user.id].inventory["9"]));
                }
                for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
                    for (const petal of data[user.id]["loadout"]) {
                        p_id = petal.split("_")[0];
                        if (p_id == -1) continue; // Skip if petal is -1
                        if (p_id == 8) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            } else {
                                extraInfo += "\nYour Missile missed!"
                            }
                            continue;
                        }
                        if (p_id == 11) {
                            for (let mobID = 0; mobID < data[user.id]["grind-info"].mobs.length; mobID++)
                            if(data[user.id]["grind-info"].mobs[mobID].health > 0) {
                                data[user.id]["grind-info"].mobs[mobID].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            }
                            continue;
                        }
                        if (p_id == 12) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0 && mobToHit != mobToAttack) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            }
                        }
                        totalPlayerDamage += petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                        data[user.id]["health"] += petalStats[p_id].heal * (3 ** (petal.split("_")[1] || 0))
                    }
                }
                if(data[user.id]["health"] > data[user.id]["max_health"]) {
                    data[user.id]["health"] = data[user.id]["max_health"]
                }
                data[user.id]["grind-info"].mobs[mobToAttack].health -= totalPlayerDamage;
                saveData();

                updatedComponents = interaction.message.components;
                //All mobs update
                let totalDamage = 0;
                for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                    if(data[user.id]["grind-info"].mobs[i].health > 0) {
                        totalDamage += data[user.id]["grind-info"].mobs[i].damage;
                    }
                    if (data[user.id]["grind-info"].mobs[i].health <= 0 && !data[user.id]["grind-info"].mobs[i].dead) {
                        data[user.id]["grind-info"].mobsLeft -= 1;
                        data[user.id]["grind-info"].mobs[i].dead = true;
                        saveData();
                        const row = new ActionRowBuilder();
                        for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                            if(data[user.id]["grind-info"].mobs[i].health <= 0) {
                                row.addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(i.toString())
                                        .setLabel(`Defeated ${data[user.id]["grind-info"].mobs[i].name}!`)
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                )
                            } else {
                                row.addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(i.toString())
                                        .setLabel(`Attack ${data[user.id]["grind-info"].mobs[i].name}`)
                                        .setStyle(ButtonStyle.Danger)
                                )
                            }
                        }
                        updatedComponents = [row];
                    }
                }
                data[user.id]["health"] -= totalDamage;
                saveData();
                if (data[user.id]["health"] <= 0) {
                    delete data[user.id]["grind-info"];
                    saveData();
                    interaction.update({
                        content: `You have died! Better luck next time!`, 
                        components: [], 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                
                if (data[user.id]["grind-info"].mobsLeft <= 0) {
                    let totalXP = 0;
                    let petalDrops = [];

                    // calc petal drops
                    for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                        totalXP += data[user.id]["grind-info"].mobs[i].loot * (4 ** petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity));
                        const randomLootDropChance = Math.random() * 2;
                        if(randomLootDropChance <= 2.0) {
                            const grindRarity = petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity);
                            let petalToDrop = mobStats[data[user.id]["grind-info"].mobs[i].name].petalDrop;
                            if(randomLootDropChance <= dropRarityChances[grindRarity][0]) {
                                petalToDrop += "_" + (grindRarity - 2);
                            } else if(randomLootDropChance <= dropRarityChances[grindRarity][1]) {
                                petalToDrop += "_" + (grindRarity - 1);
                            } else {
                                petalToDrop += "_" + grindRarity;
                            }
                            if (petalToDrop.split("_")[1] < 0) {
                               continue;
                            }
                            petalDrops.push(petalToDrop);
                        }
                    }
                    let gotRareLoot = Math.random() < 0.05;
                    if(gotRareLoot) {
                        totalXP *= 5;
                    }
                    editXP(user.id, totalXP);
                    data[user.id]["stars"] = (data[user.id]["stars"] || 0) + Math.ceil(totalXP / 2);
                    let petalDropText = "\n**New petals dropped!**";
                    // console.log("petalDrops", petalDrops);
                    for(const pet in petalDrops) {
                        let the_petal = petalDrops[pet];
                        if (the_petal.split("_")[1] < 0) continue;
                        // increase 
                        if(data[user.id]["inventory"][the_petal] == undefined) {
                            data[user.id]["inventory"][the_petal] = 1;
                        } else {
                            data[user.id]["inventory"][the_petal] += 1;
                        }
                        petalDropText += `\n- ${getPetalRarity(the_petal)} ${getPetalType(the_petal)}`;
                    }
                    if(petalDropText == "\n**New petals dropped!**") petalDropText = "";
                    saveData();

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
                    interaction.update({
                        content: `You have completed the grind${gotRareLoot ? " and gotten **Rare Loot**" : ""}! This has given you ${totalXP} XP and ${Math.ceil(totalXP / 2)} stars!${petalDropText}\nWould you like to continue grinding in this zone or go to a higher rarity zone?`, 
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("continue-grind")
                                        .setLabel("Continue grinding")
                                        .setStyle(ButtonStyle.Primary),
                                    new ButtonBuilder()
                                        .setCustomId("higher-rarity")
                                        .setLabel("Go to higher rarity zone")
                                        .setStyle(ButtonStyle.Success)
                                )
                        ], 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                let mobList = "";
                for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                    mobList += `${data[user.id]["grind-info"].mobs[i].rarity} ${data[user.id]["grind-info"].mobs[i].name}: ${data[user.id]["grind-info"].mobs[i].health} HP, ${data[user.id]["grind-info"].mobs[i].damage} DMG\n`;
                }
                interaction.update({
                    content: `You are grinding in the ${biomes[data[user.id]["grind-info"].biome].name} for ${data[user.id]["grind-info"].rarity} mobs.${extraInfo}\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
                    components: updatedComponents, 
                    flags: MessageFlags.Ephemeral
                });
            } else {
                interaction.deferUpdate();
            }
        } else if (interaction.customId === "continue-grind") {
            const biome = data[interaction.user.id]["grind-info"].biome;
            const rarity = data[interaction.user.id]["grind-info"].rarity;
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            if(data[user.id]["health"] <= 0) {
                interaction.reply("You are dead! You cannot grind.");
                return;
            }

            let mobAmount = Math.min(Math.round(Math.random() * petalLowercaseRarities.indexOf(rarity) + 2), 5);
            let mobs = [];
            for (let i = 0; i < mobAmount; i++) {
                let randomID = Math.floor(Math.random() * biomes[biome].mobs.length);
                let mob = biomes[biome].mobs[randomID];
                if (mobStats[mob].reroll) {
                    mob = biomes[biome].mobs[Math.floor(Math.random() * biomes[biome].mobs.length)];
                }
                mobs.push(mob);
            }
            let mobInfo = [];
            for (let i = 0; i < mobs.length; i++) {
                mobInfo[i] = {
                    name: mobs[i],
                    loot: mobStats[mobs[i]].loot,
                    rarity: petalRarities[petalLowercaseRarities.indexOf(rarity)], 
                    health: mobStats[mobs[i]].health * (5 ** petalLowercaseRarities.indexOf(rarity)), 
                    damage: mobStats[mobs[i]].damage * (3 ** petalLowercaseRarities.indexOf(rarity)), 
                    dead: false
                }
            }

            const row = new ActionRowBuilder();
            for (let i = 0; i < mobs.length; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel(`Attack ${mobs[i]}`)
                        .setStyle(ButtonStyle.Danger)
                )
            }
            
            data[user.id]["grind-info"] = {
                biome: biome,
                rarity: rarity, 
                mobs: mobInfo, 
                messageID: interaction.id, 
                mobsLeft: mobAmount
            }
            if(!data[user.id]["health"]) data[user.id]["health"] = 30;
            saveData();
            
            let mobList = "";
            for (let i = 0; i < mobs.length; i++) {
                mobList += `${mobInfo[i].rarity} ${mobs[i]}: ${mobInfo[i].health} HP, ${mobInfo[i].damage} DMG\n`;
            }

            interaction.update({
                content: `You are grinding in the ${biomes[biome].name} for ${rarity} mobs.\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
                components: [row], 
                flags: MessageFlags.Ephemeral
            });
        } else if (interaction.customId === "higher-rarity") {
            const biome = data[interaction.user.id]["grind-info"].biome;
            const rarity = petalLowercaseRarities[petalLowercaseRarities.indexOf(data[interaction.user.id]["grind-info"].rarity) + 1];
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            if(data[user.id]["health"] <= 0) {
                interaction.reply("You are dead! You cannot grind.");
                return;
            }

            let mobAmount = Math.min(Math.round(Math.random() * petalLowercaseRarities.indexOf(rarity) + 2), 5);
            let mobs = [];
            for (let i = 0; i < mobAmount; i++) {
                let randomID = Math.floor(Math.random() * biomes[biome].mobs.length);
                let mob = biomes[biome].mobs[randomID];
                if (mobStats[mob].reroll) {
                    mob = biomes[biome].mobs[Math.floor(Math.random() * biomes[biome].mobs.length)];
                }
                mobs.push(mob);
            }
            let mobInfo = [];
            for (let i = 0; i < mobs.length; i++) {
                mobInfo[i] = {
                    name: mobs[i],
                    loot: mobStats[mobs[i]].loot,
                    rarity: petalRarities[petalLowercaseRarities.indexOf(rarity)], 
                    health: mobStats[mobs[i]].health * (5 ** petalLowercaseRarities.indexOf(rarity)), 
                    damage: mobStats[mobs[i]].damage * (3 ** petalLowercaseRarities.indexOf(rarity))
                }
            }

            const row = new ActionRowBuilder();
            for (let i = 0; i < mobs.length; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(i.toString())
                        .setLabel(`Attack ${mobs[i]}`)
                        .setStyle(ButtonStyle.Danger)
                )
            }
            
            data[user.id]["grind-info"] = {
                biome: biome,
                rarity: rarity, 
                mobs: mobInfo, 
                messageID: interaction.id, 
                mobsLeft: mobAmount
            }
            if(!data[user.id]["health"]) data[user.id]["health"] = 30;
            saveData();
            
            let mobList = "";
            for (let i = 0; i < mobs.length; i++) {
                mobList += `${mobInfo[i].rarity} ${mobs[i]}: ${mobInfo[i].health} HP, ${mobInfo[i].damage} DMG\n`;
            }

            interaction.update({
                content: `You are grinding in the ${biomes[biome].name} for ${rarity} mobs.\nYour health: ${data[user.id].health}\nMobs: \n${mobList}`, 
                components: [row], 
                flags: MessageFlags.Ephemeral
            });
        } else if (interaction.customId.includes("craft-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            const petalType = interaction.customId.split("-")[1];
            const currentPetalRarity = petalType.split("_")[1];

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

            console.log(petalCraftChances[currentPetalRarity]);
            if (Math.random() > petalCraftChances[currentPetalRarity]+1) { // failed craft
                let rows = [];
                let petalsSoFar = 0;
                for (const petal in data[user.id]["inventory"]) {
                    if(petalsSoFar % 5 == 0) {
                        rows.push(new ActionRowBuilder());
                    }
                    rows[rows.length - 1].addComponents(
                        new ButtonBuilder()
                            .setCustomId(`craft-${petal}`)
                            .setLabel(`${getPetalRarity(petal)} ${getPetalType(petal)} (${util.getCraftCost(petal.split("_")[1])} stars)`)
                            .setStyle(ButtonStyle.Primary)
                    );
                    petalsSoFar++;
                }
                interaction.update({
                    content: `Crafting failed! You lost ${reqirement} stars.\nSelect a petal to craft.\nYour stars: ${data[user.id].stars}`, 
                    components: rows, 
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            data[user.id]["inventory"][petalType] -= 1; // success
            let newPetalType = petalType.split("_")[0] + "_" + (parseInt(currentPetalRarity) + 1);

            // remove 1 of prev rarity
            if(data[user.id]["inventory"][petalType] <= 0) {
                delete data[user.id]["inventory"][petalType];

                let loadoutIndex = data[user.id]["loadout"].indexOf(petalType)
                if(loadoutIndex > -1) {
                    data[user.id]["loadout"][loadoutIndex] = newPetalType;
                }
            }

            if(data[user.id]["inventory"][newPetalType]) {
                data[user.id]["inventory"][newPetalType] += 1;
            } else {
                data[user.id]["inventory"][newPetalType] = 1;
            }
            saveData();
            let rows = [];
            let petalsSoFar = 0;
            for (const petal in data[user.id]["inventory"]) {
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`craft-${petal}`)
                        .setLabel(`${getPetalRarity(petal)} ${getPetalType(petal)} (${util.getCraftCost(petal.split("_")[1])} stars)`)
                        .setStyle(ButtonStyle.Primary)
                );
                petalsSoFar++;
            }
            console.log("currentPetalRarity", parseInt(currentPetalRarity)+1)
            interaction.update({
                content: `Crafted your petal to a ${petalRarities[parseInt(currentPetalRarity) + 1]} for ${reqirement} stars!\nSelect a petal to craft.\nYour stars: ${data[user.id].stars}`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId.includes("editslot-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
            const slotID = interaction.customId.split("-")[1];
            const petalToSlotIn = interaction.customId.split("-")[2];
            data[user.id]["loadout"][slotID] = petalToSlotIn;
            saveData();

            let rows = [];
            let petalsSoFar = 0;
            for (const petal in data[user.id]["inventory"]) {
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                let style = ButtonStyle.Primary;
                let text = `${getPetalRarity(petal)} ${getPetalType(petal)}`;
                let dis = false;
                if(data[user.id]["loadout"].indexOf(petal) >= 0) {
                    dis = true;
                    if(data[user.id]["loadout"].indexOf(petal) == parseInt(slotID)) {
                        style = ButtonStyle.Success;
                        text += ` already in slot ${parseInt(slotID)+1}!`;
                    } else {
                        style = ButtonStyle.Danger;
                        text += ` in another slot!`;
                    }
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`editslot-${parseInt(slotID)}-${petal}`)
                        .setLabel(text)
                        .setStyle(style)
                        .setDisabled(dis)
                );
                petalsSoFar++;
            }

            interaction.update({
                content: `Slotted ${petalTypes[parseInt(petalToSlotIn)]} into slot ${parseInt(slotID)+1}.\nWhich petal should go in slot ${parseInt(slotID)+1}?`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        }
    }
});

client.login(TOKEN);
