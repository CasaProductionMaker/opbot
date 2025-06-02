// loadoutHandler.js
// Handles loadout management for both primary and secondary loadouts

const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getPetalRarity, getPetalType } = require('./util');

class LoadoutHandler {
    /**
     * Handles equipping a petal into a loadout slot
     * @param {Object} userData - The user's data object
     * @param {string} loadoutType - Either 'loadout' or 'second_loadout'
     * @param {number} slotId - The slot ID to equip the petal in
     * @param {string} petalId - The ID of the petal to equip
     * @param {number} rarity - The rarity of the petal to equip
     * @returns {Object} Object containing the updated user data and whether the operation was successful
     */
    static equipPetal(userData, loadoutType, slotId, petalId, rarity) {
        const updatedData = JSON.parse(JSON.stringify(userData));
        let alreadyEquipped = false;

        // Check if petal is already equipped in any slot
        for (let i = 0; i < updatedData[loadoutType].length; i++) {
            if (updatedData[loadoutType][i] === `${petalId}_${rarity}`) {
                alreadyEquipped = true;
                break;
            }
        }

        if (!alreadyEquipped) {
            // Remove petal from slot, put in inventory
            const [slotPetal, slotPetalRarity] = updatedData[loadoutType][slotId].split("_");
            
            if (slotPetal !== "-1") {
                if (!updatedData.inventory[slotPetal]) {
                    updatedData.inventory[slotPetal] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                }
                updatedData.inventory[slotPetal][slotPetalRarity]++;
            }
            
            // Add new petal to slot from inventory
            updatedData[loadoutType][slotId] = `${petalId}_${rarity}`;
            if (updatedData.inventory[petalId]?.[rarity] > 0) {
                updatedData.inventory[petalId][rarity]--;
            }
        }

        return {
            updatedData,
            success: !alreadyEquipped,
            alreadyEquipped
        };
    }

    /**
     * Creates petal selection buttons for a specific petal type
     * @param {Object} userData - The user's data object
     * @param {string} loadoutType - Either 'loadout' or 'second_loadout'
     * @param {number} slotId - The slot ID the buttons are for
     * @param {string} petalId - The ID of the petal to create buttons for
     * @returns {Array} Array of ActionRowBuilder objects with petal buttons
     */
    static createPetalButtons(userData, loadoutType, slotId, petalId) {
        const rows = [];
        let petalsSoFar = 0;
        const inventory = userData.inventory[petalId] || [];

        for (let rarity = 0; rarity < inventory.length; rarity++) {
            if (inventory[rarity] <= 0) continue;

            if (petalsSoFar % 5 === 0) {
                rows.push(new ActionRowBuilder());
            }

            const isEquipped = userData[loadoutType].includes(`${petalId}_${rarity}`);
            let style = ButtonStyle.Primary;
            let text = `${getPetalRarity(rarity)} ${getPetalType(petalId)}`;
            const disabled = isEquipped;

            if (isEquipped) {
                const equippedSlot = userData[loadoutType].indexOf(`${petalId}_${rarity}`);
                style = equippedSlot === slotId ? ButtonStyle.Success : ButtonStyle.Danger;
                text += equippedSlot === slotId 
                    ? ` already in slot ${slotId + 1}!` 
                    : ` in another slot!`;
            }

            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setCustomId(`slotpetal${loadoutType === 'second_loadout' ? '2' : ''}-${slotId}-${petalId}-${rarity}`)
                    .setLabel(text)
                    .setStyle(style)
                    .setDisabled(disabled)
            );
            petalsSoFar++;
        }

        return rows;
    }

    /**
     * Gets the appropriate response message after equipping a petal
     * @param {boolean} success - Whether the operation was successful
     * @param {boolean} alreadyEquipped - Whether the petal was already equipped
     * @param {string} petalName - The name of the petal
     * @param {number} slotId - The slot ID
     * @param {string} loadoutType - Either 'loadout' or 'second_loadout'
     * @param {number} petalsAvailable - Number of petals available
     * @returns {Object} Object containing the message content and components
     */
    static getResponseMessage(success, alreadyEquipped, petalName, slotId, loadoutType, petalsAvailable) {
        if (alreadyEquipped) {
            return {
                content: `You already have one of this petal in slot ${slotId + 1}${loadoutType === 'second_loadout' ? ' of your secondary loadout' : ''}!`,
                components: []
            };
        }

        if (petalsAvailable === 0) {
            return {
                content: `Success. You now have no ${petalName} left in your inventory!`,
                components: []
            };
        }

        return {
            content: `**New ${loadoutType === 'second_loadout' ? 'secondary ' : ''}loadout**\nWhich ${petalName} do you want to put in slot ${slotId + 1}?`,
            components: []
        };
    }
}

module.exports = LoadoutHandler;
