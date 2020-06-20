Basically, the classes the rest of the game cares about are:

Config
-This is an interface between the config file and my code, and may require adjustment based on
the necessary structure for that config file. I haven't looked at the construct project recently
so I don't know if there are changes there. My pass at the config file structure is defined as a variable in Config.js


Timeline
-Major data model object representing the entire game state, really. Code elsewhere are probably
most concerned with the getNode / getCurrentNode methods, the currentNodeIndex variable, and
perhaps most importantly the changeCurrentNodeCharacterActions method. All methods and variables are
static.

TimelineNode
-You can get these from the Timeline. Each has an array of CharacterSnapshots, an array of character action objects, an EnemySnapshot, and an enemy action object. These are designed to be
read-only for all intents and purposes from the outside. When the player changes the actions for a
node, we should use Timeline.changeCurrentNodeCharacterActions to make the change (which will
update the rest of the timeline too).

ActionBuilder
-I decided not to make classes representing individual actions. Instead, action data is represented
by a bunch of classless JS objects, which we get either from the config file or from the
ActionBuilder class, which can make them with the appropriate static method call. Then, there is the
ActionExecutor class which takes care of all execution logic. The whole thing is structured so that
the front-end never needs to interact with the ActionExecutor though.

Integration goes something like this:
-At game start, feed the config file to the Config class, and initialize Timeline
-Go to the "end node" on the timeline for the beginning lose state
-Set the currentNodeIndex variable and use getCurrentNode on the Timeline to move around as the
player selects nodes.
-Use the TimelineNode returned by Timeline.getCurrentNode as a model to display the appropriate
health bars, currently selected actions, etc for a given node.
-When the player makes changes to a node, use ActionBuilder to get a new array of action objects
to represent their selections, then feed that array to Timeline.changeCurrentNodeCharacterActions
-Timeline does lots of work updating the entire future. The Timeline will also pass back some kind
of "results" object which provides info for things like damage numbers. That doesn't happen yet.
Individual actions executions produce result objects, but there's no mechanism to make them
available to the rest of the game.
-Check in on the "end" node through Timeline.getEndNode() and see if the player has won
-Either advance to the end node or advance to the next node based on the result
