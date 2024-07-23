const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { ModelInstance } = require('../modules/ObaBogaAPI.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('complete')
        .setDescription('Ask FoxyMoe to complete your sentence!')
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The prompt to complete.')
                .setRequired(true)),
    /**
    * @param {CommandInteraction} interaction 
    */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const userMessage = interaction.options.getString('message')
        /**@type {ModelInstance} ObaConnection */
        const ObaConnection = interaction.client.ObaConnection

        if (ObaConnection) {
            const completionResponse = await ObaConnection.PostCompletions(userMessage);
            if (completionResponse) {
                await interaction.editReply({ content: completionResponse, ephemeral: true });
            }
            else {
                await interaction.editReply({ content: "The bot failed to get a response from the LLM.", ephemeral: true });
            }
        } else {
            await interaction.editReply({ content: "There is no ObaBogaInstance currently selectionned.", ephemeral: true });
        }
    },
};