// mobs.js
// Defines mob stats
// Edited by stormlet on 5/29/2025

export const biomes = {
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
export const mobStats = {
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