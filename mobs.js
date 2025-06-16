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
        ], 
        startingZone: "Garden Spawn",
        map: {
            "Garden Spawn": {
                name: "Garden Spawn", 
                rarity: 0, 
                mobs: [
                    "Hornet",
                    "Bee",
                    "Rock", 
                    "Ladybug",
                    "Spider"
                ],
                connections: {
                    "Left": "Flower Patch",
                    "Right": "Backyard"
                }
            }, 
            "Flower Patch": {
                name: "Flower Patch", 
                rarity: 1,
                mobs: [
                    "Hornet",
                    "Bee",
                    "Rock", 
                    "Ladybug",
                    "Spider"
                ],
                connections: {
                    "Forward": "Hive Forests"
                }
            }, 
            "Backyard": {
                name: "Backyard", 
                rarity: 1, 
                mobs: [
                    "Rock", 
                    "Ladybug"
                ], 
                connections: {
                    "Forward": "Garden Shed"
                }
            }, 
            "Hive Forests": {
                name: "Hive Forests", 
                rarity: 2, 
                mobs: [
                    "Hornet", 
                    "Bee"
                ], 
                connections: {
                    "Right": "Live Plains"
                }
            }, 
            "Garden Shed": {
                name: "Garden Shed", 
                rarity: 2, 
                mobs: [
                    "Spider"
                ], 
                connections: {
                    "Left": "Live Plains"
                }
            }, 
            "Live Plains": {
                name: "Live Plains", 
                rarity: 3, 
                mobs: [
                    "Hornet", 
                    "Bee", 
                    "Rock", 
                    "Ladybug", 
                    "Spider"
                ], 
                connections: {
                    "Left": "Garden of Legends", 
                    "Right": "Red Garden"
                }
            }, 
            "Garden of Legends": {
                name: "Garden of Legends", 
                rarity: 4, 
                mobs: [
                    "Hornet", 
                    "Bee", 
                    "Rock"
                ], 
                connections: {
                    "Left": "Deep Forest", 
                    "Right": "Rocky Mountains"
                }
            },
            "Red Garden": {
                name: "Red Garden", 
                rarity: 4, 
                mobs: [
                    "Ladybug", 
                    "Spider"
                ], 
                connections: {
                    "Left": "Fountain Garden",
                    "Right": "Dense Forest"
                }
            },
            "Deep Forest": {
                name: "Deep Forest", 
                rarity: 5, 
                mobs: [
                    "Hornet", 
                    "Bee", 
                    "Rock", 
                    "Ladybug",
                    "Spider"
                ], 
                connections: {
                    "Right": "Thorny Bushes"
                }
            },
            "Rocky Mountains": {
                name: "Rocky Mountains", 
                rarity: 5, 
                mobs: [
                    "Rock"
                ], 
                connections: {
                    "Right": "Thick Overgrowth"
                }
            },
            "Fountain Garden": {
                name: "Fountain Garden", 
                rarity: 5, 
                mobs: [
                    "Ladybug", 
                    "Spider", 
                    "Hornet"
                ], 
                connections: {
                    "Forward": "Thick Overgrowth"
                }
            },
            "Dense Forest": {
                name: "Dense Forest", 
                rarity: 5, 
                mobs: [
                    "Hornet", 
                    "Spider"
                ], 
                connections: {
                    "Left": "Thick Overgrowth"
                }
            },
            "Thorny Bushes": {
                name: "Thorny Bushes", 
                rarity: 6, 
                mobs: [
                    "Hornet", 
                    "Bee", 
                    "Spider",
                ]
            },
            "Thick Overgrowth": {
                name: "Thick Overgrowth", 
                rarity: 6, 
                mobs: [
                    "Hornet", 
                    "Bee", 
                    "Rock", 
                    "Ladybug", 
                    "Spider"
                ]
            }
        }
    }, 
    "desert": {
        name: "Desert",
        mobs: [
            "Scorpion",
            "Cactus",
            "Sandstorm", 
            "Beetle"
        ], 
        startingZone: "Desert Spawn",
        map: {
            "Desert Spawn": {
                name: "Desert Spawn", 
                rarity: 0,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Forward": "Desert Oasis",
                }
            }, 
            "Desert Oasis": {
                name: "Desert Oasis", 
                rarity: 1,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Left": "North Desert", 
                    "Right": "South Desert"
                }
            }, 
            "North Desert": {
                name: "North Desert", 
                rarity: 2,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Left": "North Dunes", 
                    "Right": "Vast Desert"
                }
            }, 
            "South Desert": {
                name: "South Desert", 
                rarity: 2,
                mobs: [
                    "Cactus"
                ],
                connections: {
                    "Right": "Stormy Dunes"
                }
            }, 
            "North Dunes": {
                name: "North Dunes", 
                rarity: 3,
                mobs: [
                    "Beetle"
                ],
                connections: {
                    "Right": "Vast Dunes"
                }
            }, 
            "Vast Desert": {
                name: "Vast Desert", 
                rarity: 3,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Right": "Vast Planes"
                }
            }, 
            "Stormy Dunes": {
                name: "Stormy Dunes", 
                rarity: 3,
                mobs: [
                    "Sandstorm"
                ],
                connections: {
                    "Left": "Vast Planes"
                }
            }, 
            "Vast Dunes": {
                name: "Vast Dunes", 
                rarity: 4,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Right": "Mythical Oasis"
                }
            }, 
            "Vast Planes": {
                name: "Vast Planes", 
                rarity: 4,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Beetle"
                ],
                connections: {
                    "Left": "Mythical Oasis"
                }
            }, 
            "Mythical Oasis": {
                name: "Mythical Oasis", 
                rarity: 5,
                mobs: [
                    "Scorpion",
                    "Cactus",
                    "Sandstorm", 
                    "Beetle"
                ],
                connections: {
                    "Left": "Tunneling Hills", 
                    "Right": "Sahara Desert", 
                    "Forward": "Sandy Graveyard"
                }
            }, 
            "Tunneling Hills": {
                name: "Tunneling Hills", 
                rarity: 6,
                mobs: [
                    "Scorpion",
                    "Beetle"
                ]
            }, 
            "Sahara Desert": {
                name: "Sahara Desert", 
                rarity: 6,
                mobs: [
                    "Beetle", 
                    "Sandstorm"
                ]
            }, 
            "Sandy Graveyard": {
                name: "Sandy Graveyard", 
                rarity: 6,
                mobs: [
                    "Cactus",
                    "Sandstorm"
                ]
            }
        }
    }, 
    "ocean": {
        name: "Ocean",
        mobs: [
            "Starfish",
            "Jellyfish",
            "Sponge", 
            "Shell", 
            "Bubble"
        ], 
        startingZone: "Ocean Spawn",
        map: {
            "Ocean Spawn": {
                name: "Ocean Spawn", 
                rarity: 0,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble"
                ],
                connections: {
                    "Forward": "Coral Reef", 
                    "Left": "Shallow Waters"
                }
            }, 
            "Shallow Waters": {
                name: "Shallow Waters", 
                rarity: 1,
                mobs: [
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble",
                    "Crab"
                ],
                connections: {}
            },
            "Coral Reef": {
                name: "Coral Reef", 
                rarity: 1,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble",
                    "Crab"
                ],
                connections: {
                    "Forward": "Tidal Pool",
                }
            },
            "Tidal Pool": {
                name: "Tidal Pool", 
                rarity: 2,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble"
                ],
                connections: {
                    "Right": "Kelp Forest", 
                    "Left": "Underwater Cave"
                }
            }, 
            "Underwater Cave": {
                name: "Underwater Cave", 
                rarity: 3,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble"
                ],
                connections: {
                    "Forward": "Lost City"
                }
            }, 
            "Kelp Forest": {
                name: "Kelp Forest", 
                rarity: 3,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Shell",
                    "Crab"
                ],
                connections: {
                    "Forward": "Rocky Waters"
                }
            },
            "Lost City": {
                name: "Lost City", 
                rarity: 4,
                mobs: [
                    "Jellyfish",
                    "Sponge", 
                    "Shell"
                ],
                connections: {
                    "Left": "Sandy Beach", 
                    "Right": "Deep Ocean"
                }
            },
            "Rocky Waters": {
                name: "Rocky Waters", 
                rarity: 4,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge"
                ],
                connections: {
                    "Left": "City of Atlantis",
                    "Right": "Clam Cove", 
                    "Forward": "Crab Kingdom"
                }
            },
            "Sandy Beach": {
                name: "Sandy Beach", 
                rarity: 5,
                mobs: [
                    "Jellyfish", 
                    "Sponge"
                ],
                connections: {
                    "Right": "Ocean Trenches"
                }
            },
            "Deep Ocean": {
                name: "Deep Ocean", 
                rarity: 5,
                mobs: [
                    "Starfish"
                ],
                connections: {
                    "Forward": "Ocean Trenches"
                }
            },
            "City of Atlantis": {
                name: "City of Atlantis", 
                rarity: 5,
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble"
                ], 
                connections: {
                    "Left": "Ocean Trenches"
                }
            },
            "Clam Cove": {
                name: "Clam Cove", 
                rarity: 5,
                mobs: [
                    "Shell", 
                    "Sponge"
                ]
            },
            "Sunken Ship": {
                name: "Sunken Ship", 
                rarity: 5,
                mobs: [
                    "Crab"
                ]
            }, 
            "Ocean Trenches": {
                name: "Ocean Trenches", 
                rarity: 6, 
                mobs: [
                    "Starfish",
                    "Jellyfish",
                    "Sponge", 
                    "Shell", 
                    "Bubble"
                ]
            }, 
            "Crab Kingdom": {
                name: "Crab Kingdom", 
                rarity: 6, 
                mobs: [
                    "Crab"
                ]
            }
        }
    }, 
    "ant_hell": {
        name: "Ant Hell",
        mobs: [
            "Soldier Ant",
            "Worker Ant",
            "Baby Ant", 
            "Queen Ant"
        ], 
        startingZone: "Ant Hell Spawn", 
        map: {
            "Ant Hell Spawn": {
                name: "Ant Hell Spawn", 
                rarity: 0,
                mobs: [
                    "Worker Ant",
                    "Baby Ant", 
                    "Queen Ant"
                ],
                connections: {
                    "Forward": "Ant Colony"
                }
            }, 
            "Ant Colony": {
                name: "Ant Colony", 
                rarity: 1,
                mobs: [
                    "Soldier Ant",
                    "Worker Ant",
                    "Baby Ant", 
                    "Queen Ant"
                ],
                connections: {
                    "Left": "Ant Hill", 
                    "Right": "Baby Den"
                }
            },
            "Ant Hill": {
                name: "Ant Hill", 
                rarity: 2,
                mobs: [
                    "Soldier Ant",
                    "Worker Ant",
                    "Queen Ant"
                ],
                connections: {
                    "Forward": "Ant Nest", 
                    "Right": "Spawning Grounds"
                }
            },
            "Baby Den": {
                name: "Baby Den", 
                rarity: 2,
                mobs: [
                    "Baby Ant"
                ],
                connections: {}
            },
            "Ant Nest": {
                name: "Ant Nest", 
                rarity: 3,
                mobs: [
                    "Soldier Ant",
                    "Worker Ant",
                    "Queen Ant"
                ],
                connections: {
                    "Forward": "Tunneling Depths", 
                    "Right": "Queen's Chamber"
                }
            },
            "Spawning Grounds": {
                name: "Spawning Grounds", 
                rarity: 3,
                mobs: [
                    "Queen Ant",
                    "Baby Ant"
                ],
                connections: {}
            },
            "Tunneling Depths": {
                name: "Tunneling Depths", 
                rarity: 4,
                mobs: [
                    "Soldier Ant",
                    "Worker Ant"
                ],
                connections: {
                    "Right": "Ant Fortress"
                }
            },
            "Queen's Chamber": {
                name: "Queen's Chamber", 
                rarity: 4,
                mobs: [
                    "Queen Ant", 
                    "Baby Ant"
                ],
                connections: {}
            },
            "Ant Fortress": {
                name: "Ant Fortress", 
                rarity: 5,
                mobs: [
                    "Soldier Ant",
                    "Worker Ant",
                    "Queen Ant", 
                    "Baby Ant"
                ],
                connections: {
                    "Forward": "Ant Throne Room"
                }
            },
            "Ant Throne Room": {
                name: "Ant Throne Room", 
                rarity: 6,
                mobs: [
                    "Queen Ant", 
                    "Soldier Ant",
                    "Worker Ant",
                    "Baby Ant"
                ]
            }
        }
        
    },
    "jungle": {
        name: "Jungle",
        mobs: [
            "Mantis",
            "Leafbug",
            "Dark Ladybug",
            "Wasp",
            "Soldier Termite",
            "Firefly",
            "Bush"
        ], 
        startingZone: "Jungle Spawn",
        map: {
            "Jungle Spawn": {
                name: "Jungle Spawn", 
                rarity: 0,
                mobs: [
                    "Mantis",
                    "Leafbug",
                    "Dark Ladybug",
                    "Wasp",
                    "Soldier Termite",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Left": "Jungle Path",
                    "Right": "Jungle Clearing"
                }
            }, 
            "Jungle Path": {
                name: "Jungle Path", 
                rarity: 1,
                mobs: [
                    "Mantis",
                    "Leafbug",
                    "Wasp"
                ],
                connections: {
                    "Forward": "Wayward Jungle"
                }
            },
            "Jungle Clearing": {
                name: "Jungle Clearing", 
                rarity: 1,
                mobs: [
                    "Dark Ladybug",
                    "Soldier Termite",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Forward": "Leafy Grove", 
                    "Right": "Sharp Glade"
                }
            },
            "Wayward Jungle": {
                name: "Wayward Jungle", 
                rarity: 2,
                mobs: [
                    "Mantis",
                    "Leafbug",
                    "Wasp", 
                    "Dark Ladybug",
                    "Soldier Termite",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Forward": "Wasp Nest", 
                    "Right": "Dense Thicket"
                }
            },
            "Leafy Grove": {
                name: "Leafy Grove", 
                rarity: 2,
                mobs: [
                    "Leafbug",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Forward": "Dense Thicket"
                }
            },
            "Sharp Glade": {
                name: "Sharp Glade", 
                rarity: 2,
                mobs: [
                    "Mantis",
                    "Wasp"
                ],
                connections: {
                    "Forward": "Leafy Overgrowth"
                }
            },
            "Wasp Nest": {
                name: "Wasp Nest", 
                rarity: 3,
                mobs: [
                    "Wasp"
                ],
                connections: {}
            },
            "Dense Thicket": {
                name: "Dense Thicket", 
                rarity: 3,
                mobs: [
                    "Mantis",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Forward": "Dense Jungle",
                }
            },
            "Leafy Overgrowth": {
                name: "Leafy Overgrowth", 
                rarity: 4,
                mobs: [
                    "Leafbug"
                ],
                connections: {
                    "Left": "Dense Jungle",
                }
            },
            "Dense Jungle": {
                name: "Dense Jungle", 
                rarity: 4,
                mobs: [
                    "Mantis",
                    "Leafbug",
                    "Dark Ladybug",
                    "Wasp",
                    "Soldier Termite",
                    "Firefly",
                    "Bush"
                ],
                connections: {
                    "Right": "Jungle Ruins", 
                    "Left": "Hidden Grove"
                }
            },
            "Jungle Ruins": {
                name: "Jungle Ruins", 
                rarity: 5,
                mobs: [
                    "Wasp",
                    "Firefly",
                    "Mantis"
                ],
                connections: {
                    "Left": "Ancient Temple"
                }
            },
            "Hidden Grove": {
                name: "Hidden Grove", 
                rarity: 5,
                mobs: [
                    "Bush",
                    "Dark Ladybug",
                    "Soldier Termite"
                ],
                connections: {
                    "Right": "Ancient Temple"
                }
            },
            "Ancient Temple": {
                name: "Ancient Temple", 
                rarity: 6,
                mobs: [
                    "Mantis",
                    "Leafbug",
                    "Dark Ladybug",
                    "Wasp",
                    "Soldier Termite",
                    "Firefly",
                    "Bush"
                ],
                connections: {}
            }
        }
    },
    "sewers": {
        name: "Sewers",
        mobs: [
            "Spider", 
            "Roach", 
            "Fly", 
            "Moth"
        ], 
        startingZone: "Sewers Spawn",
        map: {
            "Sewers Spawn": {
                name: "Sewers Spawn", 
                rarity: 0,
                mobs: [
                    "Spider", 
                    "Roach", 
                    "Fly", 
                    "Moth"
                ],
                connections: {
                    "Forward": "Sewer Tunnels"
                }
            }, 
            "Sewer Tunnels": {
                name: "Sewer Tunnels", 
                rarity: 1,
                mobs: [
                    "Spider", 
                    "Roach", 
                    "Fly", 
                    "Moth"
                ],
                connections: {
                    "Left": "Underground Lake",
                    "Right": "Dark Sewers"
                }
            }, 
            "Underground Lake": {
                name: "Underground Lake", 
                rarity: 2,
                mobs: [
                    "Moth", 
                    "Roach"
                ],
                connections: {
                    "Forward": "Cave of Echoes"
                }
            }, 
            "Dark Sewers": {
                name: "Dark Sewers", 
                rarity: 2,
                mobs: [
                    "Fly", 
                    "Moth"
                ],
                connections: {
                    "Forward": "Abandoned Labyrinth"
                }
            }, 
            "Cave of Echoes": {
                name: "Cave of Echoes", 
                rarity: 3,
                mobs: [
                    "Spider", 
                    "Roach", 
                    "Fly"
                ],
                connections: {
                    "Left": "Forgotten Catacombs", 
                    "Right": "Scuttling Passage"
                }
            }, 
            "Abandoned Labyrinth": {
                name: "Abandoned Labyrinth", 
                rarity: 3,
                mobs: [
                    "Roach", 
                    "Spider"
                ],
                connections: {
                    "Right": "Arachnid Lair"
                }
            }, 
            "Forgotten Catacombs": {
                name: "Forgotten Catacombs", 
                rarity: 4,
                mobs: [
                    "Fly",
                    "Moth"
                ],
                connections: {
                    "Right": "Tunneling Pipes"
                }
            }, 
            "Scuttling Passage": {
                name: "Scuttling Passage", 
                rarity: 4,
                mobs: [
                    "Roach"
                ],
                connections: {
                    "Forward": "Tunneling Pipes"
                }
            }, 
            "Arachnid Lair": {
                name: "Arachnid Lair", 
                rarity: 4,
                mobs: [
                    "Spider"
                ],
                connections: {
                    "Left": "Tunneling Pipes"
                }
            },
            "Tunneling Pipes": {
                name: "Tunneling Pipes", 
                rarity: 5,
                mobs: [
                    "Spider", 
                    "Roach", 
                    "Fly", 
                    "Moth"
                ],
                connections: {
                    "Left": "Buzzing Grates", 
                    "Right": "Insect Trench"
                }
            },
            "Buzzing Grates": {
                name: "Buzzing Grates", 
                rarity: 6,
                mobs: [
                    "Moth", 
                    "Fly"
                ],
                connections: {}
            },
            "Insect Trench": {
                name: "Insect Trench", 
                rarity: 6,
                mobs: [
                    "Roach", 
                    "Spider"
                ],
                connections: {}
            }
        }
    }
}
export const mobStats = {
    "Hornet": {
        health: 7, 
        damage: 3, 
        loot: 4, 
        petalDrop: [8], 
        reroll: false
    }, 
    "Bee": {
        health: 4, 
        damage: 3, 
        loot: 2, 
        petalDrop: [21], 
        reroll: false
    }, 
    "Rock": {
        health: 10, 
        damage: 0, 
        loot: 1, 
        petalDrop: [3], 
        reroll: false
    }, 
    "Ladybug": {
        health: 6, 
        damage: 2, 
        loot: 3, 
        petalDrop: [13], 
        reroll: false
    }, 
    "Spider": {
        health: 8, 
        damage: 2.5, 
        loot: 5, 
        petalDrop: [9], 
        reroll: false
    }, 
    "Scorpion": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: [24, 27], 
        reroll: false
    },
    "Cactus": {
        health: 10, 
        damage: 3, 
        loot: 2, 
        petalDrop: [10], 
        reroll: false
    },
    "Sandstorm": {
        health: 9, 
        damage: 4, 
        loot: 5, 
        petalDrop: [12], 
        reroll: false
    },
    "Beetle": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: [27], 
        reroll: false
    },
    "Starfish": {
        health: 7, 
        damage: 3, 
        loot: 3, 
        petalDrop: [7], 
        reroll: false
    },
    "Jellyfish": {
        health: 6, 
        damage: 3, 
        loot: 4, 
        petalDrop: [11], 
        reroll: false
    },
    "Sponge": {
        health: 5, 
        damage: 1, 
        loot: 1, 
        petalDrop: [26], 
        reroll: false
    },
    "Shell": {
        health: 5, 
        damage: 2, 
        loot: 2, 
        petalDrop: [26], 
        reroll: false
    },
    "Bubble": {
        health: 1,
        damage: 0,
        loot: 1,
        petalDrop: [18],
        armour: 1,
        reroll: true
    },
    "Soldier Ant": {
        health: 8, 
        damage: 1, 
        loot: 3, 
        petalDrop: [12], 
        reroll: false
    },
    "Worker Ant": {
        health: 6, 
        damage: 1, 
        loot: 2, 
        petalDrop: [4], 
        reroll: false
    },
    "Baby Ant": {
        health: 4, 
        damage: 1, 
        loot: 1, 
        petalDrop: [2], 
        reroll: false
    },
    "Queen Ant": {
        health: 10, 
        damage: 2, 
        loot: 4, 
        petalDrop: [5], 
        reroll: true
    },
    "Mantis": {
        health: 6, 
        damage: 2, 
        loot: 2, 
        petalDrop: [15], 
        reroll: false
    },
    "Leafbug": {
        health: 8,
        damage: 1.5,
        loot: 3,
        petalDrop: [14],
        reroll: false,
        armour: 0.75
    },
    "Dark Ladybug": {
        health: 4,
        damage: 1,
        loot: 1.5,
        petalDrop: [13],
        reroll: false
    },
    "Wasp": {
        health: 3,
        damage: 3,
        loot: 2,
        petalDrop: [16],
        reroll: false
    },
    "Soldier Termite": {
        health: 10,
        damage: 0.5,
        loot: 3,
        petalDrop: [6, 22],
        reroll: true
    },
    "Firefly": {
        health: 3,
        damage: 1,
        loot: 2,
        petalDrop: [25],
        reroll: false
    },
    "Bush": {
        health: 10,
        damage: 0,
        loot: 2,
        petalDrop: [17],
        reroll: true
    }, 
    "Roach": {
        health: 5,
        damage: 1,
        loot: 1,
        petalDrop: [24],
        reroll: false
    },
    "Fly": {
        health: 3,
        damage: 1,
        loot: 1,
        petalDrop: [19, 20, 5],
        reroll: false,
        evasion: 0.05
    },
    "Moth": {
        health: 4,
        damage: 1.5,
        loot: 1.5,
        petalDrop: [5, 25],
        reroll: false
    },
    "Crab": {
        health: 4,
        damage: 3,
        loot: 3,
        petalDrop: [23],
        reroll: false
    }
}