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
	BOOSTED: "boosted",
	STUNNED: "stunned"
};

const TARGET_TYPE = {
	ALLY: "ally",
	ENEMY: "enemy"
};

const ITEM_TYPE = {
	WEAPON: "weapon",
	ARMOR: "armor",
	USABLE: "usable"
};

const ITEM_TARGET_TYPE = {
	ALLY: "ally",
	ENEMY: "enemy"
};
