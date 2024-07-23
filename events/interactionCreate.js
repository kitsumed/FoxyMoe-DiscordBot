const { Events, CommandInteraction } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    /**
     * Manage commands interactions
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: interaction.ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: interaction.ephemeral });
            }
        }
    },
};