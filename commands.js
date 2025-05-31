// commands.js
// Defines bot commands
// Edited by stormlet on 5/29/2025

import { ApplicationCommandOptionType } from 'discord.js';
import { petalTypes } from './petals.js';
import { biomes } from './mobs.js';

export const commands = [
    {
        name: "upgrade_talents", 
        description: "Upgrade your talents for more damage and health."
    },
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
                    },
                    {
                        name: "Jungle",
                        value: "jungle"
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
        name: "loadout",
        description: "View a user's loadout",
        options: [
            {
                name: "user", 
                description: "The user to get loadout of. If not provided, it will get your loadout.",
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
        name: "edit_loadout", 
        description: "Change which petal is in a loadout slot."
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
