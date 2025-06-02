const util = require('../util')

module.exports = {
    name: 'profile',
    description: 'Shows your profile',
    execute(interaction, data, saveData, onlyLoadout = false) {
        
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
            inventoryText += util.petalToText(petal, inter, data);
        }

        // print loadout
        let loadoutText = util.makeLoadoutText(inter.user.id, data);
        let secondaryLoadoutText = util.makeLoadoutText(inter.user.id, data, true);

        // print final text
        let finalText = ""
        if(onlyLoadout) {
            finalText = `**Current Loadout:**\n${loadoutText}\n**Secondary Loadout:**\n${secondaryLoadoutText}`;
        } else {
            finalText = `**Profile of ${inter.user.username}**\nLevel ${level}, XP: ${xp}\nStars: ${stars}\nHealth: ${health}/${maxHealth}\n**Inventory:**\n${inventoryText}**Current Loadout:**\n${loadoutText}\n**Secondary Loadout:**\n${secondaryLoadoutText}`;
        }
    
        interaction.reply({
            content: finalText
        });
    }
  };