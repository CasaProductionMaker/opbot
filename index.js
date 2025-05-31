const { TOKEN, GUILD_ID, BOT_ID } = require('./config.json');
const fs = require('fs');
const dataFile = "saved_data.json";
let data = {};

const { REST, Routes, Client, IntentsBitField, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags } = require('discord.js');
const { deserialize } = require('v8');
const { type } = require('os');

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

const petalRarities = [
    "Common",
    "Unusual",
    "Rare",
    "Epic",
    "Legendary", 
    "Mythic",
    "Ultra", 
    "Super",
    "Unique"
]
const petalCraftChances = [
    0.64,
    0.32,
    0.16,
    0.08,
    0.04, 
    0.02,
    0.01, 
    1.0
]
const petalLowercaseRarities = [
    "common",
    "unusual",
    "rare",
    "epic",
    "legendary", 
    "mythic",
    "ultra", 
    "super",
    "unique"
]
const dropRarityChances = [
    [0, 0.75], 
    [0.1, 0.8], 
    [0.05, 0.9], 
    [0.01, 0.95], 
    [0.05, 0.97], 
    [0.2, 0.99], 
    [0.8, 0.999], //0.1% chance for ultra drop
    [0.6, 0.9999] // 0.01% chance for super drop
]
const petalTypes = [
    "Basic", // 0
    "Peas", 
    "Light", 
    "Rock", 
    "Leaf", 
    "Wing", // 5
    "Bone", 
    "Starfish", 
    "Missile", 
    "Faster", 
    "Cactus", // 10
    "Lightning", 
    "Glass", 
    "Rose"
]
const petalStats = [
    {
        name: "Basic", 
        description: "A basic petal, not too strong, not too weak.", 
        damage: 2, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Peas", 
        description: "4 in 1 deal.", 
        damage: 3, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Light", 
        description: "Fast reload, but low damage.", 
        damage: 2, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Rock", 
        description: "Very durable.", 
        damage: 4, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Leaf", 
        description: "Heals you, but does low damage.", 
        damage: 2, 
        heal: 2, 
        max_health: 0
    }, 
    {
        name: "Wing", 
        description: "It hits hard.", 
        damage: 4, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Bone", 
        description: "Sturdy.", 
        damage: 4, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Starfish", 
        description: "Good heal, but low damage.", 
        damage: 1, 
        heal: 3, 
        max_health: 0
    }, 
    {
        name: "Missile", 
        description: "Goes off in a random direction, so it can miss the target.", 
        damage: 4, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Faster", 
        description: "Makes your petals spin faster, giving them a chance to hit twice.", 
        damage: 2, 
        heal: 0, 
        max_health: 0, 
        rotation: 0.1
    }, 
    {
        name: "Cactus", 
        description: "Somehow increases your max health.", 
        damage: 2, 
        heal: 0, 
        max_health: 10
    }, 
    {
        name: "Lightning", 
        description: "Chains off all the enemies, damaging all of them.", 
        damage: 2, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Glass", 
        description: "Can hit 0-2 enemies, stacking damage.", 
        damage: 3, 
        heal: 0, 
        max_health: 0
    }, 
    {
        name: "Rose", 
        description: "Very weak for offence, but excellent for healing.", 
        damage: 0, 
        heal: 4, 
        max_health: 0
    }
]

const biomes = {
    "garden": {
        name: "Garden",
        mobs: [
            "Hornet",
            "Bee",
            "Rock", 
            "Ladybug",
            "Spider"
        ]
    }, 
    "desert": {
        name: "Desert",
        mobs: [
            "Scorpion",
            "Cactus",
            "Sandstorm", 
            "Beetle"
        ]
    }, 
    "ocean": {
        name: "Ocean",
        mobs: [
            "Starfish",
            "Jellyfish",
            "Sponge", 
            "Shell"
        ]
    }, 
    "ant_hell": {
        name: "Ant Hell",
        mobs: [
            "Soldier Ant",
            "Worker Ant",
            "Baby Ant", 
            "Queen Ant"
        ]
    }
}
const mobStats = {
    "Hornet": {
        health: 7, 
        damage: 3, 
        loot: 4, 
        petalDrop: 8, 
        reroll: false
    }, 
    "Bee": {
        health: 4, 
        damage: 3, 
        loot: 2, 
        petalDrop: 0, 
        reroll: false
    }, 
    "Rock": {
        health: 10, 
        damage: 0, 
        loot: 1, 
        petalDrop: 3, 
        reroll: false
    }, 
    "Ladybug": {
        health: 6, 
        damage: 2, 
        loot: 3, 
        petalDrop: 13, 
        reroll: false
    }, 
    "Spider": {
        health: 8, 
        damage: 3, 
        loot: 5, 
        petalDrop: 9, 
        reroll: false
    }, 
    "Scorpion": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: 0, 
        reroll: false
    },
    "Cactus": {
        health: 10, 
        damage: 3, 
        loot: 2, 
        petalDrop: 10, 
        reroll: false
    },
    "Sandstorm": {
        health: 10, 
        damage: 4, 
        loot: 5, 
        petalDrop: 12, 
        reroll: false
    },
    "Beetle": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: 0, 
        reroll: false
    },
    "Starfish": {
        health: 7, 
        damage: 3, 
        loot: 3, 
        petalDrop: 7, 
        reroll: false
    },
    "Jellyfish": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: 11, 
        reroll: false
    },
    "Sponge": {
        health: 5, 
        damage: 1, 
        loot: 1, 
        petalDrop: 0, 
        reroll: false
    },
    "Shell": {
        health: 5, 
        damage: 2, 
        loot: 2, 
        petalDrop: 0, 
        reroll: false
    },
    "Soldier Ant": {
        health: 8, 
        damage: 1, 
        loot: 3, 
        petalDrop: 6, 
        reroll: false
    },
    "Worker Ant": {
        health: 6, 
        damage: 1, 
        loot: 2, 
        petalDrop: 4, 
        reroll: false
    },
    "Baby Ant": {
        health: 4, 
        damage: 1, 
        loot: 1, 
        petalDrop: 2, 
        reroll: false
    },
    "Queen Ant": {
        health: 10, 
        damage: 2, 
        loot: 4, 
        petalDrop: 5, 
        reroll: true
    }
}

const commands = [
    {
        name: "xp_edit", 
        description: "Add or remove XP from a user (Admin only)",
        options: [
            {
                name: "user", 
                description: "The user to edit xp of.",
                type: ApplicationCommandOptionType.User,
                required: true
            }, 
            {
                name: "amount", 
                description: "The amount of xp to add or substract.",
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    },
    {
        name: "stars_edit", 
        description: "Add or remove stars from a user (Admin only)",
        options: [
            {
                name: "user", 
                description: "The user to edit stars of.",
                type: ApplicationCommandOptionType.User,
                required: true
            }, 
            {
                name: "amount", 
                description: "The amount of stars to add or substract.",
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    }, 
    {
        name: "craft_petal", 
        description: "Craft your petal for stars. This has a chance to fail which increases the higher the rarity."
    }, 
    {
        name: "grind", 
        description: "Grind a biome for mobs to get XP and stars.", 
        options: [
            {
                name: "biome", 
                description: "The biome to grind in.",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "Ant Hell",
                        value: "ant_hell"
                    }, 
                    {
                        name: "Garden",
                        value: "garden"
                    }, 
                    {
                        name: "Ocean",
                        value: "ocean"
                    }, 
                    {
                        name: "Desert",
                        value: "desert"
                    }
                ]
            }
        ]
    }, 
    {
        name: "profile", 
        description: "Get a user's profile information.",
        options: [
            {
                name: "user", 
                description: "The user to get profile of. If not provided, it will get your profile.",
                type: ApplicationCommandOptionType.User
            }
        ]
    }, 
    {
        name: "respawn", 
        description: "Respawn your character to full health every 5 mins. If spend option is 'yes' you can use 50 stars.", 
        options: [
            {
                name: "spend", 
                description: "Whether or not to spend stars to respawn.",
                type: ApplicationCommandOptionType.String
            }
        ]
    }, 
    {
        name: "help", 
        description: "Get a list of all bot commands."
    }, 
    {
        name: "spawn_super", 
        description: "Spawn a Super mob (Admin only)", 
        options: [
            {
                name: "mob", 
                description: "The mob to spawn.",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }, 
    {
        name: "edit_slot", 
        description: "Change which petal is in a loadout slot.", 
        options: [
            {
                name: "slot", 
                description: "Slot to edit.", 
                type: ApplicationCommandOptionType.Number, 
                required: true, 
                choices: [
                    {
                        name: "Slot 1", 
                        value: 0
                    }, 
                    {
                        name: "Slot 2", 
                        value: 1
                    }, 
                    {
                        name: "Slot 3", 
                        value: 2
                    }
                ]
            }
        ]
    }, 
    {
        name: "submit_idea", 
        description: "Submit an idea for the bot.", 
        options: [
            {
                name: "idea", 
                description: "The idea in question.", 
                type: ApplicationCommandOptionType.String, 
                required: true
            }
        ]
    }, 
    {
        name: "add_petal", 
        description: "Add a petal to a user (Admin only)", 
        options: [
            {
                name: "user", 
                description: "The user to add a petal to", 
                type: ApplicationCommandOptionType.User, 
                required: true
            }, 
            {
                name: "petal", 
                description: "The petal to add", 
                type: ApplicationCommandOptionType.Number, 
                required: true
            }, 
            {
                name: "rarity", 
                description: "The rarity of the petal", 
                type: ApplicationCommandOptionType.Number, 
                required: true
            }
        ]
    }, 
    {
        name: "remove_petal", 
        description: "Remove a petal from a user (Admin only)", 
        options: [
            {
                name: "user", 
                description: "The user to remove a petal from", 
                type: ApplicationCommandOptionType.User, 
                required: true
            }, 
            {
                name: "petal", 
                description: "The petal to remove", 
                type: ApplicationCommandOptionType.Number, 
                required: true
            }
        ]
    }, 
    {
        name: "petal_stats", 
        description: "Get the stats for a petal.", 
        options: [
            {
                name: "petal", 
                description: "The petal to get stats of.", 
                type: ApplicationCommandOptionType.Number, 
                required: true, 
                choices: petalTypes.map(( type, index ) => ({ name: type, value: index}))
            }, 
            {
                name: "rarity", 
                description: "Petal rarity.", 
                type: ApplicationCommandOptionType.Number, 
                required: true, 
                choices: [
                    {
                        name: "Common", 
                        value: 0
                    }, 
                    {
                        name: "Unusual", 
                        value: 1
                    }, 
                    {
                        name: "Rare", 
                        value: 2
                    }, 
                    {
                        name: "Epic", 
                        value: 3
                    }, 
                    {
                        name: "Legendary", 
                        value: 4
                    }, 
                    {
                        name: "Mythic", 
                        value: 5
                    }, 
                    {
                        name: "Ultra", 
                        value: 6
                    }, 
                    {
                        name: "Super", 
                        value: 7
                    }, 
                    {
                        name: "Unique", 
                        value: 8
                    }
                ]
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

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

function editXP(user, value) {
    let xp = data[user]["xp"] || 0;
    data[user]["xp"] = xp + value;
    saveData();
}
function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
}
function getCurrentTime() {
    let date = new Date();
    return date.getTime();
}
function fillInProfileBlanks(profile) {
    if (!profile.xp) profile.xp = 0;
    profile.level = Math.floor(Math.sqrt(profile.xp) * 0.6);
    if (!profile.stars) profile.stars = 0;
    if (!profile.inventory) profile.inventory = {0: 0};
    if (!profile.loadout) profile.loadout = [0, -1, -1];
    if (!profile.health) profile.health = 30;
    let totalMH = 0;
    for(let i = 0; i < 3; i++) {
        if(profile.loadout[i] < 0) continue;
        totalMH += petalStats[profile.loadout[i]].max_health * (3 ** profile.inventory[profile.loadout[i]]);
    }
    profile.max_health = Math.floor(Math.sqrt(5 * profile.xp) + 30) + totalMH;
    return profile;
}
function getCraftCost(rarity) {
    return Math.floor((20 * rarity ** 5) + 5)
}

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
        data[user.user.id] = fillInProfileBlanks(data[user.user.id] || {});
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
        data[user.user.id] = fillInProfileBlanks(data[user.user.id] || {});
        data[user.user.id]["stars"] += amount.value;
        saveData();
        interaction.reply(`Added ${amount.value} stars to ${user.user.username}. Total stars: ${data[user.user.id]["stars"]}`);
    }
    if (interaction.commandName === 'craft_petal') {
        const user = interaction.user;
        data[user.id] = fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`craft-${petal}`)
                    .setLabel(`${petalRarities[data[user.id]["inventory"][petal]]} ${petalTypes[petal]} (${getCraftCost(data[user.id]["inventory"][petal])} stars)`)
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
    if (interaction.commandName === 'profile') {
        const inter = interaction.options.get('user') || interaction;
        data[inter.user.id] = fillInProfileBlanks(data[inter.user.id] || {});
        saveData();
        let xp = data[inter.user.id].xp;
        let stars = data[inter.user.id].stars;
        let level = data[inter.user.id].level;
        let maxHealth = data[inter.user.id].max_health;
        let health = data[inter.user.id].health != null ? data[inter.user.id].health : maxHealth;
        let inventoryText = "";
        for (const petal in data[inter.user.id].inventory) {
            let rarity = data[inter.user.id].inventory[petal];
            let petalType = petalTypes[petal];
            let petalRarity = petalRarities[rarity];
            let petalDamageValue = petalStats[petal].damage * (3 ** rarity);
            inventoryText += `- ${petalRarity} ${petalType}: ${petalDamageValue} Damage\n`;
        }
        let loadoutText = "";
        for (const i in data[inter.user.id].loadout) {
            const petal = data[inter.user.id].loadout[i];
            if (petal < 0) {
                loadoutText += `- Empty Slot!\n`;
                continue;
            }
            let rarity = data[inter.user.id].inventory[petal];
            let petalType = petalTypes[petal];
            let petalRarity = petalRarities[rarity];
            let petalDamageValue = petalStats[petal].damage * (3 ** rarity);
            loadoutText += `- ${petalRarity} ${petalType}: ${petalDamageValue} Damage\n`;
        }
        let finalText = `**Profile of ${inter.user.username}**\nLevel ${level}, XP: ${xp}\nStars: ${stars}\nHealth: ${health}/${maxHealth}\n**Inventory:**\n${inventoryText}**Current Loadout:**\n${loadoutText}`;
        interaction.reply({
            content: finalText
        });
    }
    if (interaction.commandName === 'respawn') {
        const user = interaction.user;
        data[user.id] = fillInProfileBlanks(data[user.id] || {})
        if(data[user.id]["health"] > 0) {
            interaction.reply("You are not dead! You cannot respawn.");
            return;
        }
        if(!data[user.id].lastRespawn) {
            data[user.id].lastRespawn = 0;
        }

        let maxHealth = data[user.id]["max_health"];
        if (getCurrentTime() - data[user.id].lastRespawn < 300000) {
            if(data[user.id]["stars"] < 50) {
                interaction.reply(`You are on cooldown! You can respawn in ${Math.ceil(5 - ((getCurrentTime() - data[user.id].lastRespawn) / 60000))} minutes or once you have 50 stars.`);
                return;
            }
            data[user.id].lastRespawn = getCurrentTime();
            data[user.id].health = maxHealth;
            data[user.id]["stars"] -= 50;
            if(data["super-mob"] && data["super-mob"].damagers[user.id]) {
                data["super-mob"].damagers[user.id] = 0;
            }
            saveData();
            interaction.reply("You have respawned! You have lost 50 stars.");
            return;
        } else {
            data[user.id].lastRespawn = getCurrentTime();
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
        
        data[user.id] = fillInProfileBlanks(data[user.id] || {});

        let rows = [];
        let petalsSoFar = 0;
        for (const petal in data[user.id]["inventory"]) {
            if(petalsSoFar % 5 == 0) {
                rows.push(new ActionRowBuilder());
            }
            let style = ButtonStyle.Primary;
            let text = `${petalRarities[data[user.id]["inventory"][petal]]} ${petalTypes[petal]}`;
            let dis = false;
            if(data[user.id]["loadout"].indexOf(parseInt(petal)) >= 0) {
                dis = true;
                if(data[user.id]["loadout"].indexOf(parseInt(petal)) == slot) {
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
        data[user.id] = fillInProfileBlanks(data[user.id] || {})

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
        data[user.id] = fillInProfileBlanks(data[user.id] || {})

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
            data[user.id] = fillInProfileBlanks(data[user.id] || {})
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
            data[user.id] = fillInProfileBlanks(data[user.id] || {});
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
                    doubleDamage = (Math.random() < (petalStats[9].rotation * (data[user.id].inventory["9"] + 1)));
                }
                for (let double = 0; double < (doubleDamage ? 2 : 1); double++) {
                    for (const petal of data[user.id]["loadout"]) {
                        if (petal == -1) continue; // Skip if petal is -1
                        if (petal == 8) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[petal].damage * (3 ** (data[user.id]["inventory"][petal] || 0));
                            } else {
                                extraInfo += "\nYour Missile missed!"
                            }
                            continue;
                        }
                        if (petal == 11) {
                            for (let mobID = 0; mobID < data[user.id]["grind-info"].mobs.length; mobID++)
                            if(data[user.id]["grind-info"].mobs[mobID].health > 0) {
                                data[user.id]["grind-info"].mobs[mobID].health -= petalStats[petal].damage * (3 ** (data[user.id]["inventory"][petal] || 0));
                            }
                            continue;
                        }
                        if (petal == 12) {
                            let mobToHit = Math.floor(Math.random() * data[user.id]["grind-info"].mobs.length);
                            if(data[user.id]["grind-info"].mobs[mobToHit].health > 0 && mobToHit != mobToAttack) {
                                data[user.id]["grind-info"].mobs[mobToHit].health -= petalStats[petal].damage * (3 ** (data[user.id]["inventory"][petal] || 0));
                            }
                        }
                        totalPlayerDamage += petalStats[petal].damage * (3 ** (data[user.id]["inventory"][petal] || 0));
                        data[user.id]["health"] += petalStats[petal].heal * (3 ** (data[user.id]["inventory"][petal] || 0))
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
                    let petalDrops = {};
                    for (let i = 0; i < data[user.id]["grind-info"].mobs.length; i++) {
                        totalXP += data[user.id]["grind-info"].mobs[i].loot * (4 ** petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity));
                        const randomLootDropChance = Math.random() * 2;
                        if(randomLootDropChance <= 1.0) {
                            const grindRarity = petalLowercaseRarities.indexOf(data[user.id]["grind-info"].rarity);
                            const petalToDrop = mobStats[data[user.id]["grind-info"].mobs[i].name].petalDrop;
                            if(randomLootDropChance <= dropRarityChances[grindRarity][0]) {
                                petalDrops[petalToDrop] = grindRarity - 2;
                            } else if(randomLootDropChance <= dropRarityChances[grindRarity][1]) {
                                petalDrops[petalToDrop] = grindRarity - 1;
                            } else {
                                petalDrops[petalToDrop] = grindRarity;
                            }
                        }
                    }
                    let gotRareLoot = Math.random() < 0.05;
                    if(gotRareLoot) {
                        totalXP *= 5;
                    }
                    editXP(user.id, totalXP);
                    data[user.id]["stars"] = (data[user.id]["stars"] || 0) + Math.ceil(totalXP / 2);
                    let petalDropText = "\n**New petals dropped!**";
                    for(const pet in petalDrops) {
                        if (petalDrops[pet] < 0) continue;
                        if(data[user.id]["inventory"][pet] == null) {
                            data[user.id]["inventory"][pet] = petalDrops[pet]
                            petalDropText += `\n- ${petalRarities[petalDrops[pet]]} ${petalTypes[pet]}`;
                        } else if(data[user.id]["inventory"][pet] < petalDrops[pet]) {
                            data[user.id]["inventory"][pet] = petalDrops[pet]
                            petalDropText += `\n- ${petalRarities[petalDrops[pet]]} ${petalTypes[pet]}`;
                        }
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
            data[user.id] = fillInProfileBlanks(data[user.id] || {});
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
            data[user.id] = fillInProfileBlanks(data[user.id] || {});
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
            data[user.id] = fillInProfileBlanks(data[user.id] || {});
            const petalType = interaction.customId.split("-")[1];
            const currentPetalRarity = data[user.id]["inventory"][petalType];

            if(currentPetalRarity >= petalRarities.length - 1) {
                interaction.reply("You have already reached the max rarity.");
                return;
            }
            let reqirement = getCraftCost(currentPetalRarity);
            if(data[user.id]["stars"] < reqirement) {
                interaction.reply("You need at least " + reqirement + " stars to attempt to craft a petal.");
                return;
            }

            data[user.id]["stars"] -= reqirement;
            saveData();

            if (Math.random() > petalCraftChances[currentPetalRarity]) { // failed craft
                let rows = [];
                let petalsSoFar = 0;
                for (const petal in data[user.id]["inventory"]) {
                    if(petalsSoFar % 5 == 0) {
                        rows.push(new ActionRowBuilder());
                    }
                    rows[rows.length - 1].addComponents(
                        new ButtonBuilder()
                            .setCustomId(`craft-${petal}`)
                            .setLabel(`${petalRarities[data[user.id]["inventory"][petal]]} ${petalTypes[petal]} (${getCraftCost(data[user.id]["inventory"][petal])} stars)`)
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

            data[user.id]["inventory"][petalType] += 1; // success
            let rows = [];
            let petalsSoFar = 0;
            for (const petal in data[user.id]["inventory"]) {
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                rows[rows.length - 1].addComponents(
                    new ButtonBuilder()
                        .setCustomId(`craft-${petal}`)
                        .setLabel(`${petalRarities[data[user.id]["inventory"][petal]]} ${petalTypes[petal]} (${getCraftCost(data[user.id]["inventory"][petal])} stars)`)
                        .setStyle(ButtonStyle.Primary)
                );
                petalsSoFar++;
            }
            interaction.update({
                content: `Crafted your petal to a ${petalRarities[currentPetalRarity + 1]} for ${reqirement} stars!\nSelect a petal to craft.\nYour stars: ${data[user.id].stars}`, 
                components: rows, 
                flags: MessageFlags.Ephemeral
            })
        } else if (interaction.customId.includes("editslot-")) {
            const user = interaction.user;
            data[user.id] = fillInProfileBlanks(data[user.id] || {});
            const slotID = interaction.customId.split("-")[1];
            const petalToSlotIn = interaction.customId.split("-")[2];
            data[user.id]["loadout"][slotID] = parseInt(petalToSlotIn);
            saveData();

            let rows = [];
            let petalsSoFar = 0;
            for (const petal in data[user.id]["inventory"]) {
                if(petalsSoFar % 5 == 0) {
                    rows.push(new ActionRowBuilder());
                }
                let style = ButtonStyle.Primary;
                let text = `${petalRarities[data[user.id]["inventory"][petal]]} ${petalTypes[petal]}`;
                let dis = false;
                if(data[user.id]["loadout"].indexOf(parseInt(petal)) >= 0) {
                    dis = true;
                    if(data[user.id]["loadout"].indexOf(parseInt(petal)) == parseInt(slotID)) {
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
