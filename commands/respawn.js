// respawn
// Maybe this could be moved into grind.js?

const util = require('../util');

module.exports = {
    name: 'respawn',
    description: 'Respawn',
    execute(interaction, data, saveData) {
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
}