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
    return petalTypes[petal];
}

// Gets the petal rarity
function getPetalRarity(petal) {
    return petalRarities[petal];
}

// Gets the petal dmg
function getPetalDamage(petal, rarity) {
    return Math.floor(petalStats[petal].damage * (3 ** rarity));
}

// Returns a string of the petal, like "Common Light (2 Damage): 5x"
function petalToText(petal, inter, includeNumber = true) {
    let petalAmounts = data[inter.user.id].inventory[petal];
    
    // check if user has any of the petal
    let hasPetal = false;
    for (let i = 0; i < petalAmounts.length; i++) {
        if (petalAmounts[i] > 0) {
            hasPetal = true;
            break;
        }
    }
    if (!hasPetal) {
        return "";
    }

    // get petal type
    let petalStrings = [];
    for (let i = 0; i < petalAmounts.length; i++) {
        if(petalAmounts[i] > 0) {
            let petalRarity = petalRarities[i];
            let petalDamageValue = getPetalDamage(petal, i);
            petalStrings.push(`  - ${petalRarity} (${petalDamageValue} Damage): ${petalAmounts[i]}x`);
        }
    }

    return "- " + petalTypes[petal] + "\n" + petalStrings.join("\n") + "\n";
}

function singlePetalToText(petal, inter) {
    let petalRarity = getPetalRarity(petal.split("_")[1]);
    let petalType = petalTypes[petal.split("_")[0]];
    let petalDamageValue = getPetalDamage(petal.split("_")[0], petal.split("_")[1]);
    return `- ${petalRarity} ${petalType} (${petalDamageValue} Damage)\n`;
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
    }

    // Upgrade talents command
    if (interaction.commandName === 'upgrade_talents') {
        const user = interaction.user;
        data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
        
        let finalText = `**Current talents**\n*Loadout:* Level ${data[user.id]["talents"]["loadout"]}\n*Evasion:* Level ${data[user.id]["talents"]["evasion"]}\n*Max HP:* Level ${data[user.id]["talents"]["max_hp"]}\n\nSelect a talent to upgrade:`;

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
                        .setCustomId(talent)
                        .setLabel(`${talent} (MAX)`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(talent)
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
                damage: Math.ceil(mobStats[mobs[i]].damage * (3 ** petalLowercaseRarities.indexOf(rarity))), 
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

    if (interaction.commandName === 'loadout') {
        const inter = interaction.options.get('user') || interaction;
        data[inter.user.id] = util.fillInProfileBlanks(data[inter.user.id] || {});
        saveData();

        let loadoutText = "";
        for (const i in data[inter.user.id].loadout) {
            const petal = data[inter.user.id].loadout[i];
            if (petal.split("_")[0] == "-1") {
                loadoutText += `- Empty Slot!\n`;
                continue;
            }
            loadoutText += singlePetalToText(petal, inter);
        }

        interaction.reply({
            content: `**Loadout of ${inter.user.username}**\n${loadoutText}`
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
            console.log(petal)
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
            loadoutText += singlePetalToText(petal, inter);
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
            content: `Which slot do you want to update?`, 
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
    if (interaction.commandName == "petal_stats") {
        const petal = interaction.options.get("petal").value;
        const rarity = interaction.options.get("rarity").value;

        let statsText = "";
        for (const [stat, val] of Object.entries(petalStats[petal])) {
            if(val <= 0 && stat != "damage") continue;
            if(stat == "rotation") {
                statsText += `**${stat}:** ${val * (rarity + 1)}\n`
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

            // calculate petal dmg
            if(data[user.id]["grind-info"].mobs[mobToAttack].health > 0) {
                let totalPlayerDamage = 0;
                let extraInfo = "";
                let doubleDamage = false;
                if(data[user.id]["loadout"].includes(9)) {
                    doubleDamage = (Math.random() < (petalStats[9].rotation * (data[user.id].inventory["9"] + 1)));
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

                // do bubble check
                let bubbleRarity = -1;
                for (const petal of data[user.id]["loadout"]) {
                    if(petal.split("_")[0] == 18) {
                        bubbleRarity = petal.split("_")[1];
                        break;
                    }
                }

                let skipChance = 0;
                let grindRarity = petalRarities.indexOf(data[user.id]["grind-info"].rarity);
                if (bubbleRarity - grindRarity > 3) {
                    skipChance = 1 
                } else if (bubbleRarity - grindRarity > 0) {
                    skipChance = 1 - 2.5 ** (- bubbleRarity + grindRarity);
                    // around 60% chance to skip 1 rarity below. per hit
                    // around 84% chance to skip 2 rarities below
                    // around 96% chance to skip 3 rarities below
                }
               
                // check all petals for dmg and heals
                for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
                    for (const petal of data[user.id]["loadout"]) {
                        p_id = petal.split("_")[0];
                        if (p_id == -1) continue; // Skip if petal is -1

                        // Missile
                        if (p_id == 8) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            } else {
                                extraInfo += "\nYour Missile missed!"
                            }
                            continue;
                        }

                        // Lightning
                        if (p_id == 11) {
                            for (let mobID = 0; mobID < data[user.id]["grind-info"].mobs.length; mobID++)
                            if(data[user.id]["grind-info"].mobs[mobID].health > 0) {
                                data[user.id]["grind-info"].mobs[mobID].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            }
                            continue;
                        }

                        // Glass
                        if (p_id == 12) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0 && mobToHit != mobToAttack) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[p_id].damage * (3 ** (petal.split("_")[1] || 0));
                            }
                        }

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
                        
                        // check mob armour
                        let mobInfo = mobStats[data[user.id]["grind-info"].mobs[mobToAttack].name]
                        if(mobInfo.armour) {
                            let mobRarity = petalRarities.indexOf(data[user.id]["grind-info"].mobs[mobToAttack].rarity)
                            let mobArmour = mobInfo.armour * (3 ** mobRarity);
                            mobArmour = Math.floor(mobArmour);
                            totalPlayerDamage -= mobArmour;
                        }
                        
                        // apply bur buff
                        if(petalStats[p_id].count) {
                            // petal has multiple copies
                            totalPlayerDamage += bur * petalStats[p_id].count;
                        } else {
                            // petal has 1 copy
                            totalPlayerDamage += bur;
                        }

                        data[user.id]["health"] += petalStats[p_id].heal * (3 ** (petal.split("_")[1] || 0))
                    }
                }

                if(data[user.id]["health"] > data[user.id]["max_health"]) {
                    data[user.id]["health"] = data[user.id]["max_health"]
                }

                // apply dmg
                data[user.id]["grind-info"].mobs[mobToAttack].health -= Math.floor(totalPlayerDamage * gleafDmgIncrease);
                saveData();

                updatedComponents = interaction.message.components;

                // calculate player armour
                let armour = 0;
                for (let i = 0; i < data[user.id]["loadout"].length; i++) {
                    if(data[user.id]["loadout"][i] != -1 && petalStats[data[user.id]["loadout"][i].split("_")[0]].armour) {
                        armour += petalStats[data[user.id]["loadout"][i].split("_")[0]].armour * (3 ** (data[user.id]["loadout"][i].split("_")[1] || 0));
                    }
                }

                armour = Math.floor(armour);

                // All mobs update
                let totalDamage = 0;
                for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                    if(data[user.id]["grind-info"].mobs[i].health > 0) {
                        totalDamage += Math.ceil(data[user.id]["grind-info"].mobs[i].damage);
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
                    }
                }
                const newRow = new ActionRowBuilder();
                newRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId("higher-rarity")
                        .setLabel("Go to higher rarity zone")
                        .setStyle(ButtonStyle.Success)
                )

                if(totalDamage > armour) {
                    data[user.id]["health"] -= totalDamage - armour;
                }

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

                    let gotRareLoot = Math.random() < 0.05;

                    // calc petal drops
                    for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                        totalXP += data[user.id]["grind-info"].mobs[i].loot * (4 ** petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity));

                        let petalRolls = 1;
                        if(gotRareLoot) {
                            petalRolls = 4;
                        }
                        for(let b = 0; b < petalRolls; b++) {
                            const randomLootDropChance = Math.random() * 2;
                            if(randomLootDropChance <= 1.0) {
                                const grindRarity = petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity);
                                let petalToDrop = mobStats[data[user.id]["grind-info"].mobs[i].name].petalDrop;
                                // console.log("petalToDrop: " + petalToDrop);
                                // console.log("grindRarity: " + grindRarity);

                                if(randomLootDropChance <= dropRarityChances[grindRarity][0]) {
                                    petalToDrop += "_" + (grindRarity - 2);
                                } else if(randomLootDropChance <= dropRarityChances[grindRarity][1]) {
                                    petalToDrop += "_" + (grindRarity - 1);
                                } else {
                                    petalToDrop += "_" + grindRarity;
                                }
                                if (petalToDrop.split("_")[1] < 0) { // filter "below common" rarities
                                continue;
                                }

                                // golden leaf overrides petal drop
                                if(petalToDrop.split("_")[0] == "17") {
                                    if(grindRarity < 4) continue;
                                    // console.log("drop chance -2", (1-dropRarityChances[grindRarity-2][1]));
                                    // console.log("drop chance -1", (1-dropRarityChances[grindRarity-1][1])/2);
                                    // console.log("drop chance same", (1-dropRarityChances[grindRarity][1])/3);
                                    // console.log("randomLootDropChance: " + randomLootDropChance);
                                    if(randomLootDropChance < (1-dropRarityChances[grindRarity-2][1])) {
                                        // For -2 rarity, it's the chance of that rarity dropping same rarity petal
                                        petalToDrop = "17_" + (grindRarity-2);
                                        petalDrops.push(petalToDrop);
                                    } else if (randomLootDropChance < (1-dropRarityChances[grindRarity-1][1])/2) {
                                        // For -1 rarity, it's the chance of that rarity dropping same rarity petal divided by 2
                                        petalToDrop = "17_" + (grindRarity-1);
                                        petalDrops.push(petalToDrop);
                                    } else if (randomLootDropChance < (1-dropRarityChances[grindRarity][1])/3) {
                                        // For same rarity, it's the chance of same rarity drop divided by 3
                                        petalToDrop = "17_" + grindRarity;
                                        petalDrops.push(petalToDrop);
                                    } else {
                                        continue;
                                    }
                                }``

                                petalDrops.push(petalToDrop);
                            }
                        }
                    }
                    if(gotRareLoot) {
                        totalXP *= 5;
                    }
                    editXP(user.id, totalXP);
                    data[user.id]["stars"] = (data[user.id]["stars"] || 0) + Math.ceil(totalXP / 2);
                    let petalDropText = "\n**New petals dropped!**";

                    // Update player inventory
                    for(const pet in petalDrops) {
                        let the_petal = petalDrops[pet];
                        let petal_id = the_petal.split("_")[0];
                        let petal_rarity = the_petal.split("_")[1];
                        if (petal_rarity < 0) continue;
                        
                        if (!data[user.id]["inventory"][petal_id]) {
                            data[user.id]["inventory"][petal_id] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }

                        data[user.id]["inventory"][petal_id][petal_rarity] += 1;
                        petalDropText += `\n- ${getPetalRarity(petal_rarity)} ${getPetalType(petal_id)}`;
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
        } else if (interaction.customId.includes("editslot-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});
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
        } else if (interaction.customId.includes("slotpetal-")) {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

            const slotID = parseInt(interaction.customId.split("-")[1]);
            const petalToSlotIn = interaction.customId.split("-")[2];
            const petalRarity = interaction.customId.split("-")[3];

            // console.log("Slot ID", slotID);
            // console.log("Petal to slot in", petalToSlotIn);
            // console.log("Petal rarity", petalRarity);

            // safeguard against double slotting. Bool value used after buttons are updated (down below)
            let alreadyEquipped = false;
            for (let i = 0; i < data[user.id]["loadout"].length; i++) {
                if(data[user.id]["loadout"][i] == `${petalToSlotIn}_${petalRarity}`) {
                    alreadyEquipped = true;
                    break;
                }
            }
            
            if(!alreadyEquipped) {
                // Remove petal from slot, put in inventory
                let slotPetal = data[user.id]["loadout"][slotID].split("_")[0];
                let slotPetalRarity = data[user.id]["loadout"][slotID].split("_")[1];
                // console.log("Slot petal", slotPetal);
                // console.log("Slot petal rarity", slotPetalRarity);
                if(slotPetal != "-1") {
                    if(data[user.id]["inventory"][slotPetal] == undefined) {
                        data[user.id]["inventory"][slotPetal] = [0, 0, 0, 0, 0, 0, 0, 0, 0]; 
                    }
                    data[user.id]["inventory"][slotPetal][slotPetalRarity]++;
                }
                
                // Add petal to slot from inventory
                data[user.id]["loadout"][slotID] = `${petalToSlotIn}_${petalRarity}`;
                if(data[user.id]["inventory"][petalToSlotIn][petalRarity] > 0) {
                    data[user.id]["inventory"][petalToSlotIn][petalRarity]--;
                }
                saveData();
            }
            

            let rows = [];
            let petalsSoFar = 0;
            for (const rarity in data[user.id]["inventory"][petalToSlotIn]) {
                if(data[user.id]["inventory"][petalToSlotIn][rarity] <= 0) continue; // skip if no petals of this rarity
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }

                let style = ButtonStyle.Primary;
                let text = `${getPetalRarity(rarity)} ${getPetalType(petalToSlotIn)}`;
                let dis = false;
                if(data[user.id]["loadout"].indexOf(`${petalToSlotIn}_${rarity}`) >= 0) {
                    dis = true;
                    if(data[user.id]["loadout"].indexOf(`${petalToSlotIn}_${rarity}`) == slotID) {
                        style = ButtonStyle.Success;
                        text += ` already in slot ${slotID+1}!`;
                    } else {
                        style = ButtonStyle.Danger;
                        text += ` in another slot!`;
                    }
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`slotpetal-${slotID}-${petalToSlotIn}-${rarity}`)
                        .setLabel(text)
                        .setStyle(style)
                        .setDisabled(dis)
                );
                petalsSoFar++;
            }

            // if the petal is already equipped, dont do the slotting
            if(alreadyEquipped) {
                interaction.update({
                    content: `You already have one of this petal in slot ${slotID+1}!`, 
                    components: rows, 
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            // Special msg if no petals left in inventory
            if (petalsSoFar == 0) {
                interaction.update({
                    content: `Success. You now have no ${petalTypes[petalToSlotIn]} left in your inventory!`, 
                    components: [], 
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            // otherwise keep msg
            let loadoutText = "";
            for (const i in data[user.id].loadout) {
                const petal = data[user.id].loadout[i];
                if (petal.split("_")[0] == "-1") {
                    loadoutText += `- Empty Slot!\n`;
                    continue;
                }
                loadoutText += singlePetalToText(petal, interaction);
            }
            interaction.update({
                content: `**New loadout:**\n${loadoutText}\nWhich ${petalTypes[petalToSlotIn]} do you want to put in slot ${slotID+1}?`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId === 'loadout') {
            const user = interaction.user;
            data[user.id] = util.fillInProfileBlanks(data[user.id] || {});

            let starCost = constants.talentCosts.loadout[data[user.id]["talents"]["loadout"]]
            data[user.id]["stars"] -= starCost;
            data[user.id]["talents"]["loadout"]++;
            data[user.id]["loadout"].push("-1_0");
            saveData();
            
            interaction.update({
                content: `You have leveled up your loadout for ${starCost} stars!`, 
                components: [], 
                flags: MessageFlags.Ephemeral
            })
        }
    }
});

client.login(TOKEN);
