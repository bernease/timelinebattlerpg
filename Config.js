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
        return Config.config.characters.length;
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

	/**
	 * @method
	 * @return {Array} Array of character action objects
	 */
	 static getAllCharacterActionsForTurn(turnIndex) {
		const actions = [];
		for (var i=0; i < Config.getNumCharacters(); i++) {
			actions.push(Config.config.turns[turnIndex]["player"+i]);
		}
		return actions;
	 }

	 /**
 	 * @method
 	 * @return {Object} Enemy action object
 	 */
	 static getEnemyActionsForTurn(turnIndex) {
	 	return Config.config.turns[turnIndex].enemy;
	 }
}
