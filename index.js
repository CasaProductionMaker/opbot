const petals = require('./petals');
const inventory = require('./commands/inventory')
const craft = require('./commands/craft')
const talents = require('./commands/talents')
const grind = require('./commands/grind')
const admin = require('./commands/admin');
const { TOKEN, GUILD_ID, BOT_ID } = require('./config.json');
const fs = require('fs');
const dataFile = "saved_data.json";
let data = {};

// Get Discord js stuff
const { REST, Routes, Client, IntentsBitField, EmbedBuilder } = require('discord.js');

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
const commands = require('./commands').commands;

function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
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
        if (message.content == "/send_embed") { // bruh what is this: oh dont worry abt it :D testing how embeds work
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
            admin.fixLoadouts(message, data);
        }
        if(message.content == "/fix_inventory_data") {
            admin.fixInventory(message, data);
        }
    }
});

client.on('interactionCreate', (interaction) => {

    // Admin only commands
    if (interaction.commandName === 'xp_edit') {
        admin.editXP(interaction, data);
    } else if (interaction.commandName === 'stars_edit') {
        admin.editStars(interaction, data);
    } else if (interaction.commandName === "add_petal") {
        admin.addPetal(interaction, data);
    } else if (interaction.commandName === "remove_petal") {
        admin.removePetal(interaction, data);
    } else if (interaction.commandName === 'spawn_super') {
        admin.spawnSuper(interaction, data);
    }

    // Normal commands
    if (interaction.commandName === 'craft_petal') {
        craft.displayCrafts(interaction, data);
    } else if (interaction.commandName === 'upgrade_talents') {
        talents.execute(interaction, data);
    } else if (interaction.commandName === 'grind') {
        grind.grind(interaction, data, client);
    } else if (interaction.commandName === 'loadout') {
        inventory.profile(interaction, data, saveData, true);
    } else if (interaction.commandName === 'profile') { 
        inventory.profile(interaction, data, saveData);
    } else if (interaction.commandName === 'respawn') {
        grind.respawn(interaction, data, saveData);
    } else if (interaction.commandName === "edit_loadout") {
        inventory.editLoadout(interaction, data, false);
    } else if (interaction.commandName === "edit_secondary_loadout") {
        inventory.editLoadout(interaction, data, true);
    } else if (interaction.commandName === 'help') {
        admin.help(interaction);
    } else if (interaction.commandName === "submit_idea") {
        admin.submitIdea(interaction, data);
    } else if (interaction.commandName === "petal_stats") {
        petals.showPetalStats(interaction);
    } else if (interaction.commandName === "swap_loadout_slot") {
        inventory.swapLoadoutSlot(interaction, data);
    } else if (interaction.commandName === "visit_target_dummy") {
        grind.visitDummy(interaction, data);
    } else if (interaction.commandName === "inventory") {
        inventory.inventory(interaction, data, saveData)
    }

    // Button handlers
    if (interaction.isButton()) {
        // super mobs to fix
        if (interaction.customId === "super-mob") {
            grind.superAttack(interaction, data);
        } else if (Number.isInteger(parseInt(interaction.customId))) {
            grind.attackMob(interaction, data);
        } else if (interaction.customId === "attack-dummy") {
            grind.dummyAttack(interaction, data);
        } else if (interaction.customId === "continue-grind") {
            grind.continueGrind(interaction, data, saveData, client);
        } else if (interaction.customId.includes("higher-rarity-")) {
            grind.advancerarity(interaction, data, client);
        } else if (interaction.customId.includes("craftpetal-")) {
            craft.displayCrafts(interaction, data);
        } else if (interaction.customId.includes("megacraft-")) {
            craft.attemptMegaCraft(interaction, data);
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
        } else if (interaction.customId === 'rare_drop_rate-talent') {
            talents.upgradeRareLootChance(interaction, data);
        } else if (interaction.customId === 'evasion-talent') {
            talents.upgradeEvasionTalent(interaction, data);
        } else if (interaction.customId === 'craft_chance-talent') {
            talents.upgradeCraftChance(interaction, data);
        } else if (interaction.customId.includes("swappetal-")) {
            inventory.swapPetal(interaction, data);
        } else if (interaction.customId.includes("invpage-")) {
            inventory.invpage(interaction, data, saveData);
        }
    }
});

client.login(TOKEN);
