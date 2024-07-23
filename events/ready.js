const { Events, Client, ActivityType } = require('discord.js');
const { BotGeneralSettingsSQL, ObaBogaInstanceSQL, ObaBogaInstanceChatHistorySQL } = require('../modules/Database.js');
const { LoadObaBogaInstanceFromSQL } = require('../functions/LoadObaBogaInstanceFromSQL.js');
const { LoadObaBogaModel } = require('../functions/LoadObaBogaModel.js')

module.exports = {
	name: Events.ClientReady,
	once: true,
	/**
	 * Run when the bot is ready
	* @param {Client} client 
	*/
	async execute(client) {
		console.log(`Bot client logged in as ${client.user.tag}!`);
		client.user.setActivity("I Don't Want to be an Engineer", { type: ActivityType.Listening })

		// Sync sqlLite Database
		await BotGeneralSettingsSQL.sync()
		await ObaBogaInstanceSQL.sync()
		await ObaBogaInstanceChatHistorySQL.sync()
		console.log("Synchronized all database models!")

		let BotGeneralSettings = await BotGeneralSettingsSQL.findByPk(1)
		if (!BotGeneralSettings) { // First run
			// Create default settings
			BotGeneralSettings = await BotGeneralSettingsSQL.create({
				ID: 1,
				currentObaBogaInstanceID: null
			});
			console.log("SETUP: Created the BotGeneralSettings entry with ID 1");
		}

		if (BotGeneralSettings.currentObaBogaInstanceID) {
			console.log(`Current ObaBogaInstance ID is set on : ${BotGeneralSettings.currentObaBogaInstanceID}`)
			const ObaConnection = client.ObaConnection = await LoadObaBogaInstanceFromSQL(BotGeneralSettings.currentObaBogaInstanceID);
			console.log(`Loaded the ObaBogaInstance & ChatHistory matching ID '${BotGeneralSettings.currentObaBogaInstanceID}'!`)
			const isModelLoaded = await LoadObaBogaModel(ObaConnection, process.env.OobaboogaModelName);
			if (isModelLoaded === true) {
				console.log(`Loaded the model '${process.env.OobaboogaModelName}' into oobabooga webui.`)
			} else {
				console.warn(`The model '${process.env.OobaboogaModelName}' was not loaded into oobabooga webui.`)
			}
		}
	},
};