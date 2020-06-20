/**
 * @class Static class representing the entire battle, from start to finish. Consists of a series of
 * {@link TimelineNode} objects, and methods for getting current state and updating state based on
 * action changes.
 * @hideconstructor
 */
class Timeline {

    /**
     * Initializes the static class. Must be called first for other methods to work.
	   * Must be called after Config class has been initialized.
     */
    static init() {
        Timeline.nodeList = [];
        /**@static @var {number} */
        Timeline.maxNodeIndex = Config.getMaxTurns();
        /**@static @var {number} */
        Timeline.endNodeIndex = -1;
        /**@static @var {number} */
        Timeline.currentNodeIndex = -1;

        Timeline.initializeTimeline();

    		// add a TimelineNode for each possible turn, repeating initial character & enemy snapshots
    		for (var turn=0; turn<Config.getMaxTurns(); turn++) {
    			let enemySnapshot = Config.getEnemyBaseData();
    			let characterSnapshots = [];
    			for (var char=0; char<Config.getNumCharacters(); char++) {
    				characterSnapshots.push(Config.getCharacterBaseDataByIndex(char));
    			}

    			// @todo Change to use copy snapshots
    			Timeline.nodeList.push(new TimelineNode(characterSnapshots,
    													enemySnapshot,
    													Config.getAllCharacterActionsForTurn(turn),
    													Config.getEnemyActionsForTurn(turn)));
    		}

    		Timeline.endNodeIndex = Config.getMaxTurns()-1;

    		// rebuild timeline from beginning
    		Timeline.rebuildTimeline(0);
    }

    /**
     * @method
     * @return {TimelineNode}
     */
    static getCurrentNode() {
        return Timeline.getNode(Timeline.currentNodeIndex);
    }

    /**
    * @method
     * @return {TimelineNode} Node where the battle "ends," i.e. the node where either the players
     * or the enemy are defeated.
     */
    static getEndNode() {
        return Timeline.getNode(Timeline.endNodeIndex);
    }

    /**
     * @method
     * @param {number} index
     * @return {TimelineNode}
     */
    static getNode(index) {
        return Timeline.nodeList[index];
    }

    /**
     * Changes the actions associated with a certain node, then updates the rest of the timeLine
     * accordingly.
     *
     * @param {number} nodeIndex Index of the node to assign new actions to.
     * @param {Object[]} newCharacterActions An array of actions (raw JS objects created with
     * {@link ActionBuilder}) for the characters. Must have the correct number of actions.
     */
    static changeNodeCharacterActions(nodeIndex, newCharacterActions) {
        let node = Timeline.getNode(nodeIndex);
        node.characterActionArray = newCharacterActions.slice();
        Timeline.rebuildTimeline(nodeIndex);
    }

    /**
     * Changes the actions associated with the current node. May be used to update the timeline
     * based on new player choices.
     * @see {@link Timeline.changeNodeCharacterActions}
     *
     * @param {Object[]} newCharacterActions An array of actions (raw JS objects created with
     * {@link ActionBuilder}) for the characters. Must have the correct number of actions.
     */
    static changeCurrentNodeCharacterActions(newCharacterActions) {
        Timeline.changeNodeCharacterActions(
            Timeline.currentNodeIndex,
            newCharacterActions
        );
    }

    /**
     * Recursively rebuilds the timeline from the given node index forward, applying all player and
     * enemy actions as appropriate. This method is called automatically from
     * {@link Timeline#changeNodeCharacterActions}.
     * @todo Make the results from the action execution available somehow, the UI will probably
     * need them.
     * @todo Clear defending probably? Currently if a player defends, they'll stay that way forever.
     * It should be cleared at the end of action execution.
     *
     * @param {number} nodeIndex Index to rebuild timeline from. (Applies actions of given node
     * index, if appropraite).
     */
    static rebuildTimeline(nodeIndex) {
        if (nodeIndex == (Timeline.maxNodeIndex-1)) return;
        const node = Timeline.getNode(nodeIndex);
        if (!node.isLive()) {
            this.endNodeIndex = Math.min(endNodeIndex, nodeIndex);
            return;
        }
        let nextNode = Timeline.getNode(nodeIndex + 1);

        // Copy current battle state to next node.
        nextNode.copy(node);

        // Apply player actions
        var results = {
            playerActionsResults: [],
            enemyActionResult: undefined
        };
        for (let i = 0; i < Config.getNumCharacters(); i++) {
            results.playerActionsResults.push(
                ActionExecutor.applyAction(
                    node.characterActions[i],   // Action
                    nextNode,                   // Battle snapshot to apply action
                    true,                       // Is player action
                    i                           // User index
                )
            );
        }

        // Apply enemy action (if enemy is alive)
        if (nextNode.isEnemyAlive()) {
            results.enemyActionResult = ActionExecutor.applyAction(
                node.enemyAction,   // Action
                nextNode,           // Battle snapshot to apply action
                false               // Is player action
            );
        }

		console.log("Recursively rebuilding timeline for node "+(nodeIndex+1));
        Timeline.rebuildTimeline(nodeIndex + 1);
    }

}

/**
 * @abstract
 * @class Data container for the state of the battle at a given turn, including health
 * and status for players and enemy.
 */
class BattleSnapshot {

    /**
     * @constructor
     *
     * @param {CharacterSnapshot[]} characterSnapshots
     * @param {EnemySnapshot} enemySnapshot
     */
    constructor(
        characterSnapshots,
        enemySnapshot
    ) {
        /**@var {EnemySnapshot}*/
        this.enemySnapshot = enemySnapshot;
        /**@var {CharacterSnapshot[]}*/
        this.characterSnapshotArray = characterSnapshots;
        this.characterSnapshotMap = {};

		for (let i=0; i < Config.getNumCharacters(); i++) {
			this.characterSnapshotMap[Config.getEraByIndex(i)] = characterSnapshots[i];
		}
        /* REMOVED DUE TO EXCEPTIONS
		this.forEachCharacter(function(character) {
            this.characterSnapshotMap[character.era] = character;
        });*/
    }

    /**
     * @method
     * @param {number} index
     * @return {CharacterSnapshot}
     */
    getCharacterSnapshotByIndex(index) {
        return this.characterSnapshotArray[index];
    }

    /**
     * @method
     * @param {string} era
     * @return {CharacterSnapshot}
     */
    getCharacterSnapshotByEra(era) {
        return this.characterSnapshotMap[era];
    }

    forEachCharacter(func) {
        this.characterSnapshotArray.forEach(func);
    }

    /**
     * @method
     * @return {boolean}
     */
    isEnemyAlive() {
        return this.enemySnapshot.isAlive();
    }

    /**
     * @method
     * @return {boolean}
     */
    anyCharacterAlive() {
		for (let i=0; i < Config.getNumCharacters(); i++) {
			if (this.characterSnapshotArray[i].isAlive()) return true;
		}
        /* REMOVED DUE TO EXCEPTIONS
		this.forEachCharacter(function(characterSnapshot) {
            if (characterSnapshot.isAlive()) return true;
        });*/
        return false;
    }

    /**
     * @method
     * @return {boolean}
     */
    isCharacterAlive(index) {
        return this.getCharacterSnapshotByIndex(index).isAlive();
    }

    /**
     * @method
     * @return {boolean}
     */
    isPlayerWin() {
        return this.anyCharacterAlive() && !this.isEnemyAlive();
    }

    /**
     * @method
     * @return {boolean}
     */
    isEnemyWin() {
        return this.isEnemyAlive() && !this.anyCharacterAlive();
    }

    /**
     * @method
     * @return {boolean} True if all characters and the enemy are dead.
     */
    isDraw() {
        return !this.isEnemyAlive() && !this.anyCharacterAlive();
    }

    /**
     * @method
     * @return {boolean} True if the enemy and at least one character are alive.
     */
    isLive() {
        return this.isEnemyAlive() && this.anyCharacterAlive();
    }

    /**
     * @method
     * @param {BattleSnapshot}
     */
    copy(snapshot) {
        this.enemySnapshot.copy(snapshot.enemySnapshot);
        for (let i = 0; i < this.characterSnapshotArray.length; i++) {
            this.characterSnapshotArray[i].copy(snapshot.characterSnapshotArray[i]);
        }
    }

}

/**
 * @class Represents a single node in the {@link Timeline}. A battle snapshot which additionally
 * keeps track of actions. Node that actions are not copied when applying
 * {@link BattleSnapshot#copy}.
 * @extends BattleSnapshot
 */
class TimelineNode extends BattleSnapshot {

    /**
     * @constructor
     *
     * @param {CharacterSnapshot[]} characterSnapshots
     * @param {EnemySnapshot} enemySnapshot
     * @param {Object[]} characterActions
     * @param {Object} enemyAction
     */
    constructor(
        characterSnapshots,
        enemySnapshot,
        characterActions,
        enemyAction
    ) {
        super(characterSnapshots, enemySnapshot);
        /**@var {Object[]}*/
        this.characterActions = characterActions,
        /**@var {Object}*/
        this.enemyAction = enemyAction
    }
}

/**
 * @abstract
 * @class Abstract data cantainer for state information about a player character or the
 * enemy.
 */
class BattlerSnapshot {

    /**
     * @constructor
     *
     * @param {number} maxHealth
     * @param {boolean} isEnemy
     */
    constructor(maxHealth, isEnemy) {
        /**@var {number}*/
        this.health = maxHealth;
        /**@var {number}*/
        this.maxHealth = maxHealth;
        /**@var {string[]}*/
        this.status = [];
        /**@var {boolean} */
        this.isEnemy = isEnemy;
    }

    /**
     * @method
     * @param {number} newHealth
     */
    setHealth(newHealth) {
        this.health = Math.min(Math.max(newHealth, 0), this.maxHealth);
    }

    /**
     * @method
     * @param {string}
     * @return {boolean}
     */
    hasStatus(statusId) {
        return this.status.indexOf(statusId) !== -1;
    }

    /**
     * @method
     * @param {string}
     */
    addStatus(statusId) {
        if (!this.hasStatus(statusId)) {
            this.status.push(statusId);
        }
    }

    /**
     * @method
     * @param {string}
     */
    removeStatus(statusId) {
        this.status = this.status.filter(function(value, index, array) {
            value != statusId
        });
    }

    setStatus(statusList) {
        this.status = statusList.splice();
    }

    /**
     * @method
     * @return {boolean}
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * @method
     * @param {BattlerSnapshot}
     */
    copy(snapshot) {
        this.health = snapshot.health;
        this.maxHealth = snapshot.maxHealth;
        this.status = snapshot.status.slice();
        this.isEnemy = snapshot.isEnemy;
    }
}

/**
 * @class Data container for the state of a player character at a given {@link BattleSnapshot}.
 * @extends BattlerSnapshot
 */
class CharacterSnapshot extends BattlerSnapshot {

    /**
     * @constructor
     *
     * @param {string} era
     * @param {number} maxHealth
     * @param {string} weapon
     * @param {string} armor
     * @param {string[]} items
     */
    constructor(era, maxHealth, weapon, armor, items) {
        super(maxHealth, false);
        /**@var {string} */
        this.era = era + "";
        /**@var {string} */
        this.weapon = weapon + "";
        /**@var {string} */
        this.armor = armor + "";
        /**@var {string[]} */
        this.inventory = items.slice();
    }

    /**
     * @method
     * @param {CharacterSnapshot}
     */
    copy(snapshot) {
        super.copy(snapshot);
        this.era = snapshot.era + "";
        this.weapon = snapshot.weapon + "";
        this.armor = snapshot.armor + "";
        this.inventory = snapshot.inventory.slice();
    }

}

/**
 * @class Data container for the state of the enemy at a given {@link BattleSnapshot}.
 * @extends BattlerSnapshot
 */
class EnemySnapshot extends BattlerSnapshot {

    /**
     * @construtor
     *
     * @param {number} maxHealth
     */
    constructor(maxHealth) {
        super(maxHealth, true);
    }

}

/**
 * @class Static class for providing the raw JS objects which are used to represent actions in
 * {@link TimelineNode} objects. Should match the structure used in the config file.
 * @hideconstructor
 */
class ActionBuilder {

    /**
     * @method
     * @return {Object}
     */
    static attackAction() {
        return { "type": PLAYER_ACTION.ATTACK };
    }

    /**
     * @method
     * @return {Object}
     */
    static defendAction() {
        return { "type": PLAYER_ACTION.DEFEND };
    }

    /**
     * @method
     * @param {number} targetIndex
     * @return {Object}
     */
    static tradeActionWeaponSwap(targetIndex) {
        return {
            "type": PLAYER_ACTION.TRADE,
            "trade_type": TRADE_TYPE.SWAP_WEAPON,
            "target": targetIndex
        };
    }

    /**
     * @method
     * @param {number} targetIndex
     * @return {Object}
     */
    static tradeActionArmorSwap(targetIndex) {
        return {
            "type": PLAYER_ACTION.TRADE,
            "trade_type": TRADE_TYPE.SWAP_ARMOR,
            "target": targetIndex
        };
    }

    /**
     * @method
     * @param {number} targetIndex
     * @param {string} itemId
     * @return {Object}
     */
    static tradeActionGiveItem(targetIndex, itemId) {
        return {
            "type": PLAYER_ACTION.TRADE,
            "trade_type": TRADE_TYPE.GIVE_ITEM,
            "item_id": itemId,
            "target": targetIndex
        };
    }

    /**
     * @method
     * @param {string} item_id
     * @param {number} targetIndex  (Can be omitted)
     * @return {Object}
     */
    static useItemAction(itemId, targetIndex=-1) {
        let actionData = {
            "type": PLAYER_ACTION.USE_ITEM,
            "item_id": itemId
        };
        if (target != -1) {
            actionData.target = targetIndex;
        }
        return actionData;
    }

    /**
     * @method
     * @param {number} targetIndex (Can be omitted and attack wil target all)
     * @return {Object}
     */
    static enemyAttackAction(targetIndex=-1) {
        let actionData = { "type": ENEMY_ACTION.ATTACK };
        if (target != -1) {
            actionData.target = targetIndex;
        }
        return actionData;
    }

    /**
     * @method
     * @return {Object}
     */
    static enemyBoostAction() {
        return { "type": ENEMY_ACTION.BOOST };
    }

    /**
     * @method
     * @param {number} targetIndex (Can be omitted and attack will target all)
     * @return {Object}
     */
    static enemyStunAction(targetIndex=-1) {
        let actionData = { "type": ENEMY_ACTION.STUN };
        if (target != -1) {
            actionData.target = targetIndex;
        }
        return actionData;
    }

    /**
     * @method
     * @return {Object}
     */
    static enemyFinalAttack() {
        return { "type": ENEMY_ACTION.FINAL_ATTACK };
    }
}

/**
 * @class Contains all action execution logic. This class is not meant to be instantiated elsewhere.
 * Rather, use the static {@link ActionExecutor.applyAction} method.
 */
class ActionExecutor {

    /**
     * @constructor
     * @protected
     */
    constructor(
        actionData,
        battleSnapshot,
        isPlayerAction,
        userIndex = -1
    ) {
        this.actionData = actionData;
        this.battleSnapshot = battleSnapshot;
        this.isPlayerAction = isPlayerAction;
        this.userIndex = userIndex;
        this.result = {
            executed: false,
            description: "",
            metadata: {},
            isPlayerAction: isPlayerAction,
            actionData: actionData
        }
    }

    /**
     * Apply an action.
     *
     * @param {Object} actionData Action data object created from {@link ActionBuilder}.
     * @param {BattleSnapshot} battleSnapshot Snapshot action effects will be applied to. (This is
     * usually the node after the node where the actions ahve been seelcted.)
     * @param {boolean} isPlayerAction Is this a player action. If false it is an enemy action.
     * @param {number} userIndex Index of the use if it is a player action.
     *
     * @return {Object} Results object. Has the following fields:
     * executed (boolean; was the action executed?)
     * descruption (string; description of action results)
     * metadata (object; data associated with specific action, such as damage done. May be empty.)
     * isPlayerAction (boolean; matches parameter)
     * userIndex (number; matches parameter, may be omitted)
     */
    static applyAction(
        actionData,
        battleSnapshot,
        isPlayerAction,
        userIndex = -1
    ) {
        let actionExecutor = new ActionExecutor(
            actionData, battleSnapshot, isPlayerAction, userIndex
        );
        actionExecutor.apply();
        return actionExecutor.result;
    }

    setResult(executed, description, metadata) {
        this.result.executed = executed;
        this.result.description = description;
        this.result.metadata = metadata || {};
        if (this.isPlayerAction) {
            this.result.userIndex = this.userIndex;
        }
    }

    apply() {
        if (this.isPlayerAction) {
            return this.applyPlayerAction();
        } else {
            return this.applyEnemyAction();
        }
    }

    applyPlayerAction() {
        if (this.userIndex == -1) {
            this.setResult(
                false,
                "Attempting to execute player action for invalid player index."
            );
        }
        this.user = this.battleSnapshot.getCharacterSnapshotByIndex(this.userIndex);
        if (!this.user.isAlive()) {
            this.setResult(false, "Character is not alive to act.");
        }
        if (this.user.hasStatus(PLAYER_STATUS_EFFECT.STUNNED)) {
            this.setResult(false, "Character is stunned.");
        }
        switch (this.actionData.type) {
            case PLAYER_ACTION.ATTACK: this.applyPlayerAttack(); break;
            case PLAYER_ACTION.DEFEND: this.applyPlayerDefend(); break;
            case PLAYER_ACTION.TRADE: this.applyPlayerTrade(); break;
            case PLAYER_ACTION.USE_ITEM: this.applyPlayerUseItem(); break;
            default:
                this.setResult(
                    false,
                    "Attempting to execute player action with invalid action type."
                );
        }
    }

    applyEnemyAction() {
        switch(this.actionData.type) {
            case ENEMY_ACTION.ATTACK: this.applyEnemyAttack(); break;
            case ENEMY_ACTION.BOOST: this.applyEnemyBoost(); break;
            case ENEMY_ACTION.STUN: this.applyEnemyStun(); break;
            case ENEMY_ACTION.FINAL_ATTACK:this. applyEnemyFinalAction(); break;
            default:
                this.setResult(
                    false,
                    "Attempting to execute enemy action with invalid action type."
                );
        }
    }

    applyPlayerAttack() {
        let weapon = Config.getItemData(this.user.weapon);
        let rawDamage = weapon.attack;
        let actualDamage = this.applyHealthChangeToEnemy(-rawDamage);
        return this.setResult(
            true,
            `${this.user.era} attacks enemy with ${weapon.name} and deals ${rawDamage} damage`,
            {
                "rawDamage": rawDamage,
                "actualDamage": actualDamage,
                "weaponId": weapon.id
            }
        );
    }

    applyPlayerDefend() {
        this.user.addStatus(PLAYER_STATUS_EFFECT.DEFENDING);
        this.setResult(true, `${this.user.era} is now defending.`);
    }

    /**
     * @todo Implement trading
     */
    applyPlayerTrade() {}

    /**
     * @todo Implement items
     */
    applyPlayerUseItem() {}

    applyEnemyAttack() {
        let damage = Config.getEnemyAttackPower();
        if (this.battleSnapshot.enemySnapshot.hasStatus(ENEMY_STATUS_EFFECT.BOOSTED)) {
            damage *= 2;
            this.battleSnapshot.enemySnapshot.removeStatus(ENEMY_STATUS_EFFECT.BOOSTED);
        }
        let actualDamage;
        let actualDamageText;
        if (this.actionData.target !== undefined) {
            let target = this.battleSnapshot.getCharacterSnapshotByIndex(this.actionData.target);
            if (!target.isAlive()) {
                this.setResult(false, "Enemy target is already dead");
                return;
            }
            actualDamage = this.applyHealthChangeToPlayer(-damage, this.actionData.target);
            actaulDamageText = actualDamage.toString();
        } else {
            actualDamage = [];
            for (let i = 0; i < Config.getNumCharacters(); i++) {
                actualDamage.push(this.applyHealthChangeToPlayer(-damage, i));
            }
            actualDamageText = actualDamage.join(", ");
        }
        this.setResult(
            true,
            `enemy attacks players, deals ${actualDamageText} damage`,
            {
                "rawDamage": damage,
                "actualDamage": actualDamage
            }
        );
    }

    applyEnemyBoost() {
        this.battleSnapshot.enemySnapshot.addStatus(ENEMY_STATUS_EFFECT.BOOSTED);
        this.setResult(true, "enemy is now boosted");
    }

    /**
     * @todo Implement enemy stun attack
     */
    applyEnemyStun() {}

    applyEnemyFinalAction() {
        for (let i = 0; i < Config.getNumCharacters(); i++) {
            this.applyHealthChangeToPlayer(-9999999, i);
        }
        this.setResult(true, `enemy wipes the party`);
    }

    applyHealthChangeToPlayer(change, targetIndex) {
        let target = this.battleSnapshot.getCharacterSnapshotByIndex(targetIndex);
        if (change < 0 && target.hasStatus(PLAYER_STATUS_EFFECT.DEFENDING)) {
            let defense = Config.getItemData(target.armor).defense;
            change = Math.min(change + defense, 0);
        }
        return this.applyHealthChange(change, target);
    }

    applyHealthChangeToEnemy(change) {
        return this.applyHealthChange(change, this.battleSnapshot.enemySnapshot);
    }

    applyHealthChange(change, battlerSnapshot) {
        let originalHealth = battlerSnapshot.health;
        battlerSnapshot.setHealth(originalHealth + change);
        return battlerSnapshot.health - originalHealth;
    }
}
