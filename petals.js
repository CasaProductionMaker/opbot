// petals.js
// Defines petals
// Edited by stormlet on 5/29/2025

export const petalTypes = [
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
    "Rose",
    "Root",
    "Bur", // 15
    "Stinger",
    "Golden Leaf",
    "Bubble", 
    "Poo", 
    "Talisman", // 20
    "Honey", 
    "Triangle"
]

export const petalStats = [
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
        max_health: 0,
        count: 4
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
    },
    {
        name: "Root",
        description: "Grants some armour against attacks.",
        damage: 2,
        heal: 0,
        max_health: 0,
        armour: 0.6
    },
    {
        name: "Bur",
        description: "Pierces through enemy armour.",
        damage: 2,
        heal: 0,
        max_health: 0,
        pierce: 0.6
    },
    {
        name: "Stinger",
        description: "Very strong. Has a chance to hit twice, but has a chance to miss.",
        damage: 3.5, // per stinger
        heal: 0,
        max_health: 0,
        count: 2
    },
    {
        name: "Golden Leaf",
        description: "Makes you attack faster. Increases all damage.",
        damage: 3,
        heal: 0,
        max_health: 0,
        dmg_increase: 0.25
    },
    {
        name: "Bubble",
        description: "Allows you to move through a zone without clearing, but taking damage from all mobs.",
        damage: 0,
        heal: 0,
        max_health: 0
    },
    {
        name: "Poo",
        description: "Reduces the number of mobs that spawn per wave.",
        damage: 0,
        heal: 0,
        max_health: 0, 
        smell: 0.1 // 10% chance to reduce mob spawn + 5% per rarity
    },
    {
        name: "Talisman",
        description: "A mobs have a chance to not hit you.",
        damage: 2,
        heal: 0,
        max_health: 0, 
        evasion: 0.15 // 20% chance to not attack + 10% per rarity
    },
    {
        name: "Honey",
        description: "Its sweet smell attracts more mobs toward you.",
        damage: 0,
        heal: 0,
        max_health: 0, 
        attraction: 0.1 // 10% chance to attract a mob + 5% per rarity
    },
    {
        name: "Triangle",
        description: "Does more damage based on how many you have equipped.",
        damage: 2,
        heal: 0,
        max_health: 0
    }
]

export function showPetalStats(interaction) {
    const petal = interaction.options.get("petal").value;
    const rarity = interaction.options.get("rarity").value;

    let statsText = "";
    for (const [stat, val] of Object.entries(petalStats[petal])) {
        if(val <= 0 && stat != "damage") continue;
        if(typeof val != "number") continue;
        let unscaled_stats = ["rotation", "count", "smell", "attraction", "dmg_increase"];
        // TODO fix scaling display
        if(unscaled_stats.includes(stat)) {
            statsText += `**${stat}:** ${val * (rarity + 1)}\n`
            continue;
        }
        if(stat == "evasion") {
            statsText += `**${stat}:** ${val + (rarity * 0.05)}\n`
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