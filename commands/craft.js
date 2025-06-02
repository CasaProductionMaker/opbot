
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getPetalType, fillInProfileBlanks } = require('../util');

module.exports = {
    name: 'craft',
    description: 'Crafts a petal',
    execute(interaction, data) {
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
}   