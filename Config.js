var config = {
	"characters": [
		{
			"era": "prehistoric",
			"max_health": 500,
			"weapon": "club",
			"armor": "hide_armor",
			"items": ["potion", "bomb"]

		},
		{
			"era": "dungeon",
			"max_health": 500,
			"weapon": "sword",
			"armor": "iron_shield",
			"items": ["potion", "bomb"]
		},
		{
			"era": "futuristic",
			"max_health": 500,
			"weapon": "laser",
			"armor": "energy_barrier",
			"items": ["potion", "bomb"]
		}

	],
	"enemy": {
		"max_health": 2000,
		"attack": 100
	},
	"eras": ["prehistoric", "dungeon", "futuristic"],
	"items": {
		"club": {
			"id": "club",
			"name": "Club",
			"type": "weapon",
			"attack": 100
		},
		"sword": {
			"id": "sword",
			"name": "Sword",
			"type": "weapon",
			"attack": 150
		},
		"laser": {
			"id": "laser",
			"name": "Laser",
			"type": "weapon",
			"attack": 200
		},
		"hide_armor": {
			"id": "hide_armor",
			"name": "Hide Armor",
			"type": "Armor",
			"defense": 50
		},
		"iron_shield": {
			"id": "iron_shield",
			"name": "Iron Shield",
			"type": "Armor",
			"defense": 50
		},
		"energy_barrier": {
			"id": "energy_barrier",
			"name": "Energy Barrier",
			"type": "Armor",
			"defense": 50
		},
		"potion": {
			"id": "potion",
			"name": "Potion",
			"type": "usable",
			"effect": {
				"type": "heal",
				"power": 200
			}
		},
		"bomb": {
			"id": "bomb",
			"name": "Bomb",
			"type": "usable",
			"effect": {
				"type": "attack",
				"power": 250
			}
		}
	},
	"max_inventory_size": 6,
	"max_turns": 4,
	"turns": [
		{
			"player0": {"type": "attack"},
			"player1": {"type": "attack"},
			"player2": {"type": "defend"},
			"enemy": {"type": "attack"}
		},
		{
			"player0": {
				"type": "trade",
				"trade_type": "swap armor",
				"target": 1
			},
			"player1": {"type": "defend"},
			"player2": {"type": "attack"},
			"enemy": {"type": "boost"}
		},
		{
			"player0": {"type": "defend"},
			"player1": {
				"type": "trade",
				"trade_type": "give item",
				"item_id": "potion",
				"target": 0
			},
			"player2": {"type": "attack"},
			"enemy": {"type": "attack"}
		},
		{
			"player0": {
				"type": "trade",
				"trade_type": "swap weapon",
				"target": 2
			},
			"player1": {"type": "attack"},
			"player2": {"type": "attack"},
			"enemy": {"type": "final_attack"}
		}
	]
};

/**
 * @enum Types of player actions.
 */
const PLAYER_ACTION = {
	ATTACK: "attack",
	DEFEND: "defend",
	TRADE: "trade",
	USE_ITEM: "item"
};

/**
 * @enum Types of trade actions.
 */
const TRADE_TYPE = {
	SWAP_WEAPON: "swap weapon",
	SWAP_ARMOR: "swap armor",
	GIVE_ITEM: "give item"
};

/**
 * @enum Types of enemy actions.
 */
const ENEMY_ACTION = {
	ATTACK: "attack",
	BOOST: "boost",
	STUN: "stun",
	FINAL_ATTACK: "final_attack"
};

/**
 * @enum Status effects which are applied to players.
 */
const PLAYER_STATUS_EFFECT = {
	DEFENDING: "defending",
	STUNNED: "stunned"
};

/**
 * @enum Status effects which are applied to the enemy.
 */
const ENEMY_STATUS_EFFECT = {
	BOOSTED: "boosted"
};

/**
 * @class Static wrapper class for config file. Has convenience getter methods for config
 * details.
 * @hideconstructor
 */
class Config {

    /**
     * Initialize the {@link Config} wrapper. Must be called for any other method to work.
     *
     * @param {Object} configJson Configuration JSON object.
     */
    static init(configJson) {
        Config.config = configJson;
        Config.validate();
    }

    /**
     * @method Validates the configuration JSON supplied to {@link Config.init}.
     * @todo Validation code
     */
    static validate() {}

    /**
     * @method
     * @param {string} era
     * @return {number}
     */
    static getEraIndex(era) {
        return Config.config.eras.indexOf(era);
    }

    /**
     * @method
     * @param {number} index
     * @return {string}
     */
    static getEraByIndex(index) {
        return Config.config.eras[index];
    }

    /**
     * @method
     * @return {number}
     */
    static getMaxTurns() {
        return Config.config.max_turns;
    }

    /**
     * @method
     * @return {number}
     */
    static getMaxInventorySize() {
        return Config.config.max_inventory_size;
    }

    /**
     * @method
     * @param {string} era
     * @return {CharacterSnapshot}
     */
    static getCharacterBaseDataByEra(era) {
        return Config.getCharacterBaseDataByIndex(
            Config.getEraIndex(era)
        );
    }

    /**
     * @method
     * @param {number} index
     * @return {CharacterSnapshot}
     */
    static getCharacterBaseDataByIndex(index) {
        let data = Config.config.characters[index];
        return new CharacterSnapshot(
            data.era,
            data.max_health,
            data.weapon,
            data.armor,
            data.items
        );
    }

    /**
     * @method
     * @return {number} The number of player characters listed in the config file. For now, this
     * should always be 3.
     */
    static getNumCharacters() {
        return Config.characters.length;
    }

    /**
     * @method
     * @param {string} id
     * @return {Object}
     */
    static getItemData(id) {
        return Config.config.items[id];
    }

    /**
     * @method
     * @return {Array}
     */
    static getInitialTurnData() {
        return Config.config.turns;
    }

    /**
     * @method
     * @return {EnemySnapshot}
     */
    static getEnemyBaseData() {
        return new EnemySnapshot(Config.getEnemyMaxHealth());
    }

    /**
     * @method
     * @return {number} Base damage enemy deals with attacks.
     */
    static getEnemyAttackPower() {
        return Config.config.enemy.attack;
    }

    /**
     * @method
     * @return {number}
     */
    static getEnemyMaxHealth() {
        return Config.config.enemy.max_health;
    }
}
