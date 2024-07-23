const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

// BotGeneralSettings is used as a global config for the bot where all the config is under the primary key 1
const BotGeneralSettings = require('../models/BotGeneralSettings.js')(sequelize, Sequelize)

const ObaBogaInstance = require('../models/ObaBogaInstance.js')(sequelize, Sequelize)
const ObaBogaInstanceChatHistory = require('../models/ObaBogaInstanceChatHistory.js')(sequelize, Sequelize)

// One-To-One relationships for BotGeneralSettings & currently selectioned ObaBogaInstance
BotGeneralSettings.belongsTo(ObaBogaInstance, { foreignKey: "currentObaBogaInstanceID", onDelete: 'SET NULL' }) // Set field to null if the key it's referring to get deleted

// One-To-Many relationships for ChatHistory
ObaBogaInstance.hasMany(ObaBogaInstanceChatHistory, { onDelete: 'CASCADE' }); // CASCADE delete every entry matching ObaBogaInstanceChatHistory entry at deletion of ObaBogaInstance
ObaBogaInstanceChatHistory.belongsTo(ObaBogaInstance, { foreignKey: 'ObaBogaInstanceID' });


module.exports = {
	BotGeneralSettingsSQL: BotGeneralSettings,
	ObaBogaInstanceSQL: ObaBogaInstance,
	ObaBogaInstanceChatHistorySQL: ObaBogaInstanceChatHistory
}