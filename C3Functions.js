// Put any global functions etc. here

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.

	runtime.objects.WindowCharAttackButton.setInstanceClass(WindowCharAttackButtonInstance);
	runtime.objects.WindowCharDefendButton.setInstanceClass(WindowCharDefendButtonInstance);
	runtime.objects.WindowCharUseButton.setInstanceClass(WindowCharUseButtonInstance);
	runtime.objects.WindowCharTradeButton.setInstanceClass(WindowCharTradeButtonInstance);
	runtime.objects.InventoryItem.setInstanceClass(InventoryItemInstance);
	runtime.objects.WindowCharPortrait.setInstanceClass(WindowCharPortraitInstance);

	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Code to run just before 'On start of layout' on
	// the first layout. Loading has finished and initial
	// instances are created and available to use here.

	let configJson = await runtime.assets.fetchJson("Level0.json");
	Config.init(configJson);
	Timeline.init();
	UIBattleWindow.init(runtime);

	console.log("Finished on before project start...")

	debugger;

	// runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime)
{
	// Code to run every tick
}

class WindowCharAttackButtonInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getPlayerAction() {
		return PLAYER_ACTION.ATTACK;
	}
}

class WindowCharDefendButtonInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getPlayerAction() {
		return PLAYER_ACTION.DEFEND;
	}
}

class WindowCharUseButtonInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getPlayerAction() {
		return PLAYER_ACTION.USE_ITEM;
	}
}

class WindowCharTradeButtonInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getPlayerAction() {
		return PLAYER_ACTION.TRADE;
	}
}

class InventoryItemInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getItemId() {
		let itemId = this.animationName;
		if (itemId == "blank" || itemId == "empty") {
			return null;
		}
		return itemId;
	}

	getItemType() {
		return Config.getItemData(this.getItemId()).type;
	}

	getItemTargetType() {
		return Config.getItemData(this.getItemId()).effect.target_type;
	}

	setAnimationFromPosition() {
		const characterSnapshot = Timeline.getNode(this.instVars.node)
					.characterSnapshotArray[this.instVars.pos];
		const slot = this.instVars.slot;
		var animationName;

		if (slot == 0) {
			animationName = characterSnapshot.weapon;
		} else if (slot == 1) {
			animationName = characterSnapshot.armor;
		} else if (slot > 1 && slot < characterSnapshot.inventory.length + 2) {
			animationName = characterSnapshot.inventory[slot - 2];
		} else {
			animationName = "empty";
		}

		this.setAnimation(animationName, "beginning");
	}
}

class WindowCharPortraitInstance extends ISpriteInstance
{
	constructor() {
		super();
	}

	getCharacterIndex() {
		// same as position
		this.instVars.pos;
	}
}

class UIBattleWindow
{
	static init(runtime) {
		console.log("setting up UI for battle window...");

		UIBattleWindow.selectors = [];
		UIBattleWindow.actionsSelected = [];
		UIBattleWindow.buttonsSelected = [];
		for (var i=0; i<Config.getNumCharacters(); i++) {
			UIBattleWindow.actionsSelected[i] = null;
		}
		UIBattleWindow.optionalSelectors = [];

		UIBattleWindow.shieldSprite;
		UIBattleWindow.currentNode;
		UIBattleWindow.currentPos;

		UIBattleWindow.validInventoryObjects;
		UIBattleWindow.validCharacterObjects;
	}

	static refreshWindow(runtime) {
		UIBattleWindow.refreshAllHPAndStatus(runtime);
		UIBattleWindow.clearNodeShieldSelection(runtime);
		UIBattleWindow.clearAllSelectors(runtime);
		UIBattleWindow.clearFinishButton(runtime);
		UIBattleWindow.hideOptionalSelectors(runtime);
	}

	static createSelectors(runtime) {
		console.log("tried to create selectors...");
		if (UIBattleWindow.selectors = []) {
			console.log("creating selectors...");
			for (var i=0; i<Config.getNumCharacters(); i++) {
				UIBattleWindow.selectors[i] = {};
				UIBattleWindow.selectors[i]["action"] = runtime.objects.WindowActionSelectorSprite
						.createInstance("gWindowUpperUI", -200, -200)
				UIBattleWindow.selectors[i]["action"].setAnimation("select");
				UIBattleWindow.selectors[i]["inventory"] = runtime.objects.WindowInventorySelectorSprite
						.createInstance("gWindowUpperUI", -200, -200);
				UIBattleWindow.selectors[i]["inventory"].setAnimation("select");
				UIBattleWindow.selectors[i]["character"] = runtime.objects.WindowCharacterSelectorSprite
						.createInstance("gWindowUpperUI", -200, -200);
				UIBattleWindow.selectors[i]["character"].setAnimation("select");
			}

		}
	}

	static validButtonSelected(runtime, button, node, pos, buttonType) {

		// remove optional selectors if added
		UIBattleWindow.hideOptionalSelectors(runtime);

		// track selection
		UIBattleWindow.buttonsSelected.push(button);

		// move action selectors
		UIBattleWindow.selectors[pos][buttonType].x = button.x;
		UIBattleWindow.selectors[pos][buttonType].y = button.y;

		// check if action is complete
		const action = UIBattleWindow.createAction(pos);
		if (action) {
			UIBattleWindow.actionsSelected[pos] = action;
		}

		// check if last action needed
		if (UIBattleWindow.areAllActionsCreated()) {
			// show button
			runtime.objects.WindowSelectButton.getFirstInstance().x = UIBattleWindow.shieldSprite.x;
		} else {
			UIBattleWindow.clearFinishButton(runtime);
		}
	}

	static actionButtonSelected(runtime, buttonUid) {
		// ignore button press based on active prev selections
		if (UIBattleWindow.getSelectionLevel() != 0) {
			return;
		}

		let selectedButton = runtime.getInstanceByUid(buttonUid);

		if (selectedButton.instVars.node != UIBattleWindow.currentNode) {
			return;
		}

		UIBattleWindow.currentPos = selectedButton.instVars.pos;

		UIBattleWindow.validButtonSelected(runtime, selectedButton, selectedButton.instVars.node,
				selectedButton.instVars.pos, "action");

		UIBattleWindow.chooseValidInventoryObjects(runtime);
		UIBattleWindow.showOptionalInventorySelectors(runtime);
	}

	static inventoryButtonSelected(runtime, buttonUid) {
		// ignore button press based on active prev selections
		if (UIBattleWindow.getSelectionLevel() != 1) {
			return;
		}

		let selectedButton = runtime.getInstanceByUid(buttonUid);

		// ignore if incorrect node
		// ignore if selection is not in the correct inventory list
		// ignore if not a valid inventory item
		// ignore if selection not one of the valid optional objects
		// ignore if action
		if (selectedButton.instVars.node != UIBattleWindow.currentNode ||
				selectedButton.instVars.pos != UIBattleWindow.currentPos ||
				selectedButton.getItemId() == null ||
				UIBattleWindow.validInventoryObjects.indexOf(selectedButton) == -1) {
			return;
		}

		UIBattleWindow.validButtonSelected(runtime, selectedButton, selectedButton.instVars.node,
				selectedButton.instVars.pos, "inventory");

		UIBattleWindow.chooseValidCharacterObjects(runtime);
		UIBattleWindow.showOptionalCharacterSelectors(runtime);
		//@todo Set image of traded items in actionReceive slot
	}

	static characterButtonSelected(runtime, buttonUid) {
		// ignore button press based on active prev selections
		if (UIBattleWindow.getSelectionLevel() != 2) { return; }

		let selectedButton = runtime.getInstanceByUid(buttonUid);

		// ignore if incorrect node
		// ignore if selection not one of the valid optional
		if (selectedButton.instVars.node != UIBattleWindow.currentNode ||
				UIBattleWindow.validCharacterObjects.indexOf(selectedButton) == -1) {
			return;
		}

		UIBattleWindow.validButtonSelected(runtime, selectedButton, selectedButton.instVars.node,
				UIBattleWindow.buttonsSelected[0].instVars.pos, "character");

		//@todo Set image of used traded targets in actionReceive slot
	}

	static getSelectionLevel() {
		return UIBattleWindow.buttonsSelected.length;
	}

	static hideOptionalSelectors() {
		while (UIBattleWindow.optionalSelectors.length > 0) {
			UIBattleWindow.optionalSelectors.pop().destroy();
		}
	}

	static showOptionalInventorySelectors(runtime) {
		for (var i in UIBattleWindow.validInventoryObjects) {
			let selector = runtime.objects.WindowInventorySelectorSprite.createInstance(
					"gWindowUpperUI",
					UIBattleWindow.validInventoryObjects[i].x,
					UIBattleWindow.validInventoryObjects[i].y
			);
			selector.setAnimation("option");
			UIBattleWindow.optionalSelectors.push(selector);
		}
	}

	static showOptionalCharacterSelectors(runtime) {2
		for (var i in UIBattleWindow.validCharacterObjects) {
			let selector = runtime.objects.WindowCharacterSelectorSprite.createInstance(
					"gWindowUpperUI",
					UIBattleWindow.validCharacterObjects[i].x,
					UIBattleWindow.validCharacterObjects[i].y);
			selector.setAnimation("option");
			UIBattleWindow.optionalSelectors.push(selector);
		}
	}

	static chooseValidInventoryObjects(runtime) {
		var selectableButtons = [];

		// inventory selectors
		if (UIBattleWindow.getSelectionLevel() != 1) { return; }

		// setup optional selector buttons
		let allButtons = runtime.objects.InventoryItem.getAllInstances();
		for (var i in allButtons) {
			if (allButtons[i].getItemId() != null &&
				allButtons[i].instVars.node == UIBattleWindow.currentNode &&
				allButtons[i].instVars.pos == UIBattleWindow.currentPos &&
				allButtons[i].instVars.actionReceive == false) {
				//@todo: cleanup complex logic, possibly merge with BattleSystem
				if (UIBattleWindow.buttonsSelected[0].getPlayerAction() == PLAYER_ACTION.ATTACK &&
					allButtons[i].getItemType() == ITEM_TYPE.WEAPON) {
					selectableButtons.push(allButtons[i]);
				} else if (UIBattleWindow.buttonsSelected[0].getPlayerAction() == PLAYER_ACTION.DEFEND &&
						   allButtons[i].getItemType() == ITEM_TYPE.ARMOR) {
					selectableButtons.push(allButtons[i]);
				} else if ((UIBattleWindow.buttonsSelected[0].getPlayerAction() == PLAYER_ACTION.USE_ITEM ||
							UIBattleWindow.buttonsSelected[0].getPlayerAction() == PLAYER_ACTION.TRADE) &&
						   allButtons[i].getItemType() == ITEM_TYPE.USABLE) {
					selectableButtons.push(allButtons[i]);
				}
			}
		}
		UIBattleWindow.validInventoryObjects = selectableButtons;
	}

	static chooseValidCharacterObjects(runtime) {
		var selectableButtons = [];

		// inventory selectors
		if (UIBattleWindow.getSelectionLevel() != 2) { return; }

		if (UIBattleWindow.buttonsSelected[1].getItemTargetType() == ITEM_TARGET_TYPE.ALLY) {
			// setup optional selector buttons
			let allButtons = runtime.objects.WindowCharPortrait.getAllInstances();
			for (var i in allButtons) {
				allButtons[i].instVars.actionReceive == false;
				allButtons[i].instVars.node == UIBattleWindow.currentNode;
				allButtons[i].instVars.pos == UIBattleWindow.currentPos;
				if (allButtons[i].instVars.actionReceive == false &&
						allButtons[i].instVars.node == UIBattleWindow.currentNode) {
					//@todo: cleanup complex logic, possibly merge with BattleSystem
					selectableButtons.push(allButtons[i]);
				}
			}
		}
		UIBattleWindow.validCharacterObjects = selectableButtons;
	}

	static createAction() {
		var selectionLevel = UIBattleWindow.getSelectionLevel();

		if (selectionLevel < 1) {
			console.error("Selection level >= 1 expected for action, retreived: " + selectionLevel);
			return null;
		}

		var actionType = UIBattleWindow.buttonsSelected[0].instVars.playerAction;

		switch (actionType) {
			case PLAYER_ACTION.ATTACK:
				return ActionBuilder.attackAction();
			case PLAYER_ACTION.DEFEND:
				return ActionBuilder.defendAction();
			default:
				// pass, continues on to inventory
		}

		if (selectionLevel < 2) {
			console.log("Selection type >= 2 expected for action, retreived: " + selectionLevel);
			return null;
		}

		var itemId = UIBattleWindow.buttonsSelected[1].getItemId();
		var itemType = UIBattleWindow.buttonsSelected[1].getItemType();
		var itemTargetType = UIBattleWindow.buttonsSelected[1].getItemTargetType();

		if (actionType == PLAYER_ACTION.USE_ITEM && itemTargetType == ITEM_TARGET_TYPE.ENEMY) {
			// use action, but enemy target so no character selection needed
			return ActionBuilder.useItemAction(itemType);
		}

		if (selectionLevel < 3) {
			console.log("Selection type >= 3 expected for action, retreived: " + selectionLevel);
			return null;
		}

		var target = UIBattleWindow.buttonsSelected[2].getCharacterIndex();

		switch (itemType) {
			case ITEM_TYPE.WEAPON:
				return ActionBuilder.tradeActionWeaponSwap(target);
			case ITEM_TYPE.ARMOR:
				return ActionBuilder.tradeActionArmorSwap(target);
			case ITEM_TYPE.USABLE:
				return ActionBuilder.tradeActionGiveItem(target, itemId);
			default:
				return null;
		}
	}


	static nodeShieldSelected(runtime, shieldUid) {
		// set all node shields to inactive
		const allNodeShields = runtime.objects.WindowShieldSprite.getAllInstances();
		for (var i in allNodeShields) {
			allNodeShields[i].setAnimation("inactive", "beginning");
		}
		// change selected to active
		const nodeShield = runtime.getInstanceByUid(shieldUid);
		this.shieldSprite = nodeShield;
		nodeShield.setAnimation("active", "beginning");

		// set current node for both UI and code
		runtime.globalVars.windowActiveNode = nodeShield.instVars.node;
		Timeline.currentNodeIndex = nodeShield.instVars.node;
		UIBattleWindow.currentNode = nodeShield.instVars.node;
	}

	static clearNodeShieldSelection(runtime) {
		// set all node shields to inactive
		const allNodeShields = runtime.objects.WindowShieldSprite.getAllInstances();
		for (var i in allNodeShields) {
			allNodeShields[i].setAnimation("inactive", "beginning");
		}

		// reset variables
		runtime.globalVars.windowActiveNode = -1;
		Timeline.currentNodeIndex = -1;
		UIBattleWindow.currentNode = null;
	}

	static clearAllSelectors(runtime) {
		var selectors = runtime.objects.WindowActionSelectorSprite.getAllInstances();
		for (var i in selectors) {
			selectors[i].x = -200;
			selectors[i].y = -200;
			selectors[i].instVars.type = "";
			selectors[i].instVars.trade_type = "";
			selectors[i].instVars.target = -1;
		}

		selectors = runtime.objects.WindowInventorySelectorSprite.getAllInstances();
		for (var i in selectors) {
			selectors[i].x = -200;
			selectors[i].y = -200;
			selectors[i].instVars.type = "";
			selectors[i].instVars.trade_type = "";
			selectors[i].instVars.target = -1;
		}

		selectors = runtime.objects.WindowCharacterSelectorSprite.getAllInstances();
		for (var i in selectors) {
			selectors[i].x = -200;
			selectors[i].y = -200;
			selectors[i].instVars.type = "";
			selectors[i].instVars.trade_type = "";
			selectors[i].instVars.target = -1;
		}
	}

	static applyAllActions(runtime) {
		if (UIBattleWindow.areAllActionsCreated()) {
			Timeline.changeCurrentNodeCharacterActions(UIBattleWindow.actionsSelected);
			runtime.goToLayout("BattleView");
			//@todo Animate selected actions based on selected node
		} else {
			//@todo Highlight object that still needs to be selected
			// This may be free with the individual button highlighting
		}
	}

	static areAllActionsCreated() {
		if (UIBattleWindow.actionsSelected.length == Config.getNumCharacters() &&
					UIBattleWindow.actionsSelected.indexOf(null) == -1) {
			return true;
		}
		return false;
	}

	static clearFinishButton(runtime) {
		runtime.objects.WindowSelectButton.getFirstInstance().x = -400;
	}

	static refreshAllHPAndStatus(runtime) {
		console.log("refreshing UI for health and status...");
		const charHealthTexts = runtime.objects.HeroHealthText.getAllInstances();
		for (var i in charHealthTexts) {
			let charSnapshot = Timeline.getNode(charHealthTexts[i].instVars.node)
					.characterSnapshotArray[charHealthTexts[i].instVars.pos];
			charHealthTexts[i].text = String(charSnapshot.health);
		}

		const enemyHealthTexts = runtime.objects.EnemyHealthText.getAllInstances();
		for (i in enemyHealthTexts) {
			let enemySnapshot = Timeline.getNode(enemyHealthTexts[i].instVars.node).enemySnapshot;
			console.log(enemySnapshot.health);
			enemyHealthTexts[i].text = String(enemySnapshot.health);
		}

		const charStatusTexts = runtime.objects.HeroStatusText.getAllInstances();
		for (i in charStatusTexts) {
			let charSnapshot = Timeline.getNode(charStatusTexts[i].instVars.node)
					.characterSnapshotArray[charStatusTexts[i].instVars.pos];
			let displayStatus = "";
			if (charSnapshot.hasStatus(PLAYER_STATUS_EFFECT.DEFENDING)) {
				displayStatus = "Defensive";
			} else if (charSnapshot.hasStatus(PLAYER_STATUS_EFFECT.STUNNED)) {
				displayStatus = "Stunned";
			}
			charStatusTexts[i].text = displayStatus;
		}

		const enemyStatusTexts = runtime.objects.EnemyStatusText.getAllInstances();
		for (i in enemyStatusTexts) {
			let enemySnapshot = Timeline.getNode(enemyStatusTexts[i].instVars.node).enemySnapshot;
			let displayStatus = "";
			if (enemySnapshot.hasStatus(ENEMY_STATUS_EFFECT.BOOSTED)) {
				displayStatus = "Boosted";
			}
			enemyStatusTexts[i].text = displayStatus;
		}

		const charInfoTexts = runtime.objects.HeroInfoText.getAllInstances();
		for (var i in charInfoTexts) {
			let charAction = Timeline.getNode(charInfoTexts[i].instVars.node)
					.characterActions[charInfoTexts[i].instVars.pos];
			charInfoTexts[i].text = String(charAction.type);
		}

		const enemyActionTexts = runtime.objects.EnemyActionText.getAllInstances();
		for (i in enemyActionTexts) {
			let enemyAction = Timeline.getNode(enemyActionTexts[i].instVars.node).enemyAction.type;

			enemyActionTexts[i].text = enemyAction;
		}

		const inventoryItems = runtime.objects.InventoryItem.getAllInstances();
		for (i in inventoryItems) {
			if (inventoryItems[i].instVars.actionReceive) {
				inventoryItems[i].setAnimation("empty");
				continue;
			}

			inventoryItems[i].setAnimationFromPosition();
		}

		const charPortraits = runtime.objects.WindowCharPortrait.getAllInstances();
		for (i in charPortraits) {
			if (charPortraits[i].instVars.actionReceive) {
				charPortraits[i].setAnimation("empty");
				continue;
			}
		}
	}
}

function UITest(runtime) {
	runtime.objects.HeroHealthText.getFirstInstance().text = "123";
}
