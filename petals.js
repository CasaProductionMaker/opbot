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
    "Golden Leaf"
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
    }
]