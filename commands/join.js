const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

// https://discordjs.guide/voice/voice-connections.html#creation
module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDMPermission(false)
		.setDescription('Join the voice channel where you are.'),
	/**
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const memberVoiceChannel = interaction.member.voice.channel
		if (!memberVoiceChannel) {
			await interaction.editReply({ content: 'You are not in a voice channel!', ephemeral: true });
			return;
		}
		const connection = joinVoiceChannel({
			channelId: memberVoiceChannel.id,
			guildId: memberVoiceChannel.guild.id,
			adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
			selfDeaf: true,
			selfMute: false
		})

		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
			// The player has entered the Ready state within 5 seconds
			await interaction.editReply({ content: 'Joined voice channel!', ephemeral: true });
		} catch (error) {
			connection.destroy();
			await interaction.editReply({ content: 'Failed to join the voice channel!', ephemeral: true });
		}
	},
};