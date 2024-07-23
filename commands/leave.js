const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

// https://discordjs.guide/voice/voice-connections.html#creation
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDMPermission(false)
		.setDescription('Leave the voice channel.'),
	/**
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const member = interaction.member
		const connection = getVoiceConnection(member.guild.id);
		if (connection) {
			connection.destroy();
			await interaction.reply({ content: 'I left the voice channel!', ephemeral: true });
			return;
		}
		await interaction.reply({ content: 'I am not inside a voice channel!', ephemeral: true });
	},
};