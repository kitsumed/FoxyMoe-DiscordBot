const { SlashCommandBuilder, CommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { BotGeneralSettingsSQL, ObaBogaInstanceSQL, ObaBogaInstanceChatHistorySQL } = require('../modules/Database.js');
const { ModelInstance } = require('../modules/ObaBogaAPI.js');
const { LoadObaBogaInstanceFromSQL } = require('../functions/LoadObaBogaInstanceFromSQL.js');
const { Paginate } = require('../functions/Paginate.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Config FoxyMoe!')
        .setDMPermission(false)
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName("ai_text_generation")
                .setDescription("Everything about ObaBogaInstances!")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('manage')
                        .setDescription('Create, edit, remove and show all ObaBogaInstance!')
                        .addStringOption(option =>
                            option.setName('action')
                                .setDescription('Please select a action.')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Create', value: 'create' },
                                    { name: 'Edit', value: 'edit' },
                                    { name: 'Remove', value: 'remove' },
                                    { name: 'List', value: 'list', },
                                ))
                        .addIntegerOption(option =>
                            option.setName("id")
                                .setDescription("Select a specific instance, if missing, the current instance is used.")
                                .setMinValue(1)
                                .setRequired(false)
                        ))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('select')
                        .setDescription('Set the default ObaBogaInstance! Will load the Instance.')
                        .addIntegerOption(option =>
                            option.setName("id")
                                .setDescription("Select")
                                .setMinValue(1)
                                .setRequired(true)
                        ))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('clear')
                        .setDescription('Clear all messages from the history of the current ObaBogaInstance & the SQLite database.')
                )
        ),
    /**
    * @param {CommandInteraction} interaction 
    */
    async execute(interaction) {
        const userID = interaction.user.id
        if (interaction.options.getSubcommandGroup() === 'ai_text_generation') {
            if (interaction.options.getSubcommand() === 'manage') {
                const BotGeneralSettings = await BotGeneralSettingsSQL.findByPk(1)
                const userAction = interaction.options.getString('action');
                const userObaBogaID = interaction.options.getInteger('id') || BotGeneralSettings.currentObaBogaInstanceID;

                // Create the modal
                const ObaBogaInstanceModal = new ModalBuilder()

                // Create the text input components for the modals of the ai_text_generation subcommands
                const chatAssistantNameInput = new TextInputBuilder()
                    .setCustomId('chatAssistantName')
                    .setLabel("What's the AI name?")
                    .setPlaceholder("FoxyMoe")
                    .setMaxLength(50)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const chatUserNameInput = new TextInputBuilder()
                    .setCustomId('chatUserName')
                    .setLabel("What's the user name?")
                    .setPlaceholder("'user' is recommended.")
                    .setValue("user") // default to user
                    .setMaxLength(50)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const chatSystemMessageInput = new TextInputBuilder()
                    .setCustomId('chatSystemMessage')
                    .setLabel("What's the system instruction for the AI?")
                    .setPlaceholder("You are FoxyMoe, you think outside the box while maintaining polite conversations.")
                    .setMaxLength(1200)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph);

                const assistantContextInput = new TextInputBuilder()
                    .setCustomId('assistantContext')
                    .setLabel("What's the context for the AI?")
                    .setPlaceholder("FoxyMoe is a friendly, prideful, and gullible AI talking with multiples users.")
                    .setMaxLength(400)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph);

                const seedInput = new TextInputBuilder()
                    .setCustomId('seed')
                    .setLabel("What's the seed for the generations?")
                    .setPlaceholder("Set -1 for a random seed.")
                    .setValue("-1")
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                // Cases inside this switch statement are scoped {} to prevent conflics with variable names between cases.
                switch (userAction) {
                    case "create": {
                        // Configure the modal
                        ObaBogaInstanceModal.setCustomId('ObaBogaInstanceCreate')
                        ObaBogaInstanceModal.setTitle('Create a ObaBogaInstance');

                        // Add inputs to the modal
                        ObaBogaInstanceModal.addComponents(
                            new ActionRowBuilder().addComponents(chatAssistantNameInput),
                            new ActionRowBuilder().addComponents(chatUserNameInput),
                            new ActionRowBuilder().addComponents(chatSystemMessageInput),
                            new ActionRowBuilder().addComponents(assistantContextInput),
                            new ActionRowBuilder().addComponents(seedInput),
                        );

                        // Show the modal to the user
                        await interaction.showModal(ObaBogaInstanceModal);

                        const filter = (interaction) => interaction.customId === 'ObaBogaInstanceCreate' & interaction.user.id == userID;
                        interaction.awaitModalSubmit({ filter, time: 900000 }).then(async interaction => { // Wait 15m in MS for a response
                            await interaction.deferReply({ ephemeral: true });
                            const chatAssistantName = interaction.fields.getTextInputValue('chatAssistantName');
                            const chatUserName = interaction.fields.getTextInputValue('chatUserName');
                            const assistantContext = interaction.fields.getTextInputValue('assistantContext');
                            const chatSystemMessage = interaction.fields.getTextInputValue('chatSystemMessage');
                            const seed = Number(interaction.fields.getTextInputValue('seed')) || -1;
                            try {
                                const newObaBogaInstanceSQL = await ObaBogaInstanceSQL.create({
                                    seed: seed,
                                    chatAssistantName: chatAssistantName,
                                    assistantContext: assistantContext,
                                    chatUserName: chatUserName,
                                    chatSystemMessage: chatSystemMessage
                                });
                                await interaction.editReply({ content: `The **${chatAssistantName}** ObaBogaInstance was successfully created with the ID \`${newObaBogaInstanceSQL.ID}\`!`, ephemeral: true });
                            } catch (error) {
                                console.error(error)
                                await interaction.editReply({ content: `A error occured when updating the SQL database.`, ephemeral: true });
                            }
                        });
                        break;
                    }
                    case "edit": {
                        // Configure the modal (MODAL ID FIX : https://stackoverflow.com/a/77286516)
                        ObaBogaInstanceModal.setCustomId(`ObaBogaInstanceEdit_${interaction.id}`)
                        ObaBogaInstanceModal.setTitle('Edit a ObaBogaInstance');

                        // Search the DB for previous values of the instance
                        const selectedObaBogaInstanceSQL = await ObaBogaInstanceSQL.findByPk(userObaBogaID);
                        if (!selectedObaBogaInstanceSQL) {
                            await interaction.reply({ content: `Failed to find the ObaBogaInstance with ID \`${userObaBogaID}\`!`, ephemeral: true });
                            break;
                        }
                        // Set the defaults values of the modal
                        chatAssistantNameInput.setValue(selectedObaBogaInstanceSQL.chatAssistantName);
                        chatUserNameInput.setValue(selectedObaBogaInstanceSQL.chatUserName);
                        assistantContextInput.setValue(selectedObaBogaInstanceSQL.assistantContext);
                        chatSystemMessageInput.setValue(selectedObaBogaInstanceSQL.chatSystemMessage);
                        seedInput.setValue(String(selectedObaBogaInstanceSQL.seed));

                        // Add inputs to the modal
                        ObaBogaInstanceModal.addComponents(
                            new ActionRowBuilder().addComponents(chatAssistantNameInput),
                            new ActionRowBuilder().addComponents(chatUserNameInput),
                            new ActionRowBuilder().addComponents(chatSystemMessageInput),
                            new ActionRowBuilder().addComponents(assistantContextInput),
                            new ActionRowBuilder().addComponents(seedInput),
                        );

                        // Show the modal to the user
                        await interaction.showModal(ObaBogaInstanceModal);

                        const filter = (modalInteraction) => modalInteraction.customId === `ObaBogaInstanceEdit_${interaction.id}` & modalInteraction.user.id == userID;
                        interaction.awaitModalSubmit({ filter, time: 900000 }).then(async modalInteraction => { // Wait 15m in MS for a response
                            await modalInteraction.deferReply({ ephemeral: true });
                            const chatAssistantName = modalInteraction.fields.getTextInputValue('chatAssistantName');
                            const chatUserName = modalInteraction.fields.getTextInputValue('chatUserName');
                            const assistantContext = modalInteraction.fields.getTextInputValue('assistantContext');
                            const chatSystemMessage = modalInteraction.fields.getTextInputValue('chatSystemMessage');
                            const seed = Number(modalInteraction.fields.getTextInputValue('seed')) || -1;
                            try {
                                await selectedObaBogaInstanceSQL.update({
                                    seed: seed,
                                    chatAssistantName: chatAssistantName,
                                    assistantContext: assistantContext,
                                    chatUserName: chatUserName,
                                    chatSystemMessage: chatSystemMessage
                                });
                                await modalInteraction.editReply({ content: `The **${chatAssistantName}** ObaBogaInstance was successfully updated! If you have modified the currently selected instance, reselect it to apply the new changes.`, ephemeral: true });
                            } catch (error) {
                                console.error(error)
                                await interaction.editReply({ content: `A error occured when updating the SQL database.`, ephemeral: true });
                            }
                        });
                        break;
                    }
                    case "remove": {
                        await interaction.deferReply({ ephemeral: true });
                        // Search the DB for previous values of the instance
                        const selectedObaBogaInstanceSQL = await ObaBogaInstanceSQL.findByPk(userObaBogaID);
                        if (!selectedObaBogaInstanceSQL) {
                            await interaction.editReply({ content: `Failed to find the ObaBogaInstance with ID \`${userObaBogaID}\`!`, ephemeral: true });
                            break;
                        }

                        const buttonsRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('remove')
                                .setLabel('Remove')
                                .setStyle(ButtonStyle.Danger)
                        );

                        const confirmMessage = await interaction.editReply({ content: `Do you really want to remove the ObaBogaInstance \`${userObaBogaID}\`?`, components: [buttonsRow], ephemeral: true });

                        const collectorFilter = i => i.user.id === interaction.user.id;
                        try {
                            const confirmation = await confirmMessage.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                            if (confirmation.customId === 'remove') {
                                try {
                                    await selectedObaBogaInstanceSQL.destroy();
                                    await interaction.editReply({ content: `The ObaBogaInstance was successfully removed!`, components: [], ephemeral: true });
                                } catch (error) {
                                    console.error(error)
                                    await interaction.editReply({ content: `A error occured when updating the SQL database.`, components: [], ephemeral: true });
                                }
                            } else if (confirmation.customId === 'cancel') {
                                await confirmation.update({ content: 'Action cancelled.', components: [], ephemeral: true });
                            }
                        } catch (e) {
                            await interaction.editReply({ content: 'Confirmation not received within 1 minute, action cancelled.', components: [], ephemeral: true });
                        }
                        break;
                    }
                    case "list": {
                        await interaction.deferReply({ ephemeral: true });
                        // Create a array that contains the ID and the AI name of every instances
                        const ObaBogaInstancesList = (await ObaBogaInstanceSQL.findAll()).map(instance => `**\`${instance.ID}\`** : ${instance.chatAssistantName}`)
                        const pageSize = 10
                        let currentPage = 1

                        // Verify if there was no obaBogaInstance found in the db
                        if (ObaBogaInstancesList.length == 0) {
                            await interaction.editReply({ content: "There isn't any ObaBogaInstance in the database.", ephemeral: true });
                            return;
                        }

                        const listEmbed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle('ObaBoga Instances List')
                            .setDescription(Paginate(ObaBogaInstancesList, pageSize, currentPage).join("\n"))
                            .setFooter({ text: `Page ${currentPage}/${Math.ceil(ObaBogaInstancesList.length / pageSize)}` });

                        const previousPageButton = new ButtonBuilder()
                            .setCustomId("list_obaboga_previous")
                            .setEmoji("⬅")
                            .setDisabled(currentPage == 1)
                            .setStyle(ButtonStyle.Primary)

                        const nextPageButton = new ButtonBuilder()
                            .setCustomId("list_obaboga_next")
                            .setEmoji("➡")
                            .setDisabled(currentPage == Math.ceil(ObaBogaInstancesList.length / pageSize))
                            .setStyle(ButtonStyle.Primary)

                        const buttonsRow = new ActionRowBuilder()
                            .addComponents(previousPageButton, nextPageButton);

                        await interaction.editReply({ embeds: [listEmbed], components: [buttonsRow], ephemeral: true });

                        const filter = (interaction) => (interaction.customId === 'list_obaboga_previous' && interaction.user.id == userID || interaction.customId === 'list_obaboga_next') && interaction.user.id == userID;
                        const buttonsCollector = interaction.channel.createMessageComponentCollector({ filter: filter, componentType: ComponentType.Button, time: 240000 }) // 4m in MS

                        buttonsCollector.on('collect', async buttonInteraction => {
                            await buttonInteraction.deferUpdate()
                            switch (buttonInteraction.customId) {
                                case "list_obaboga_previous":
                                    currentPage--
                                    break;
                                case "list_obaboga_next":
                                    currentPage++
                                    break;
                            }
                            previousPageButton.setDisabled(currentPage == 1)
                            nextPageButton.setDisabled(currentPage == Math.ceil(ObaBogaInstancesList.length / pageSize))
                            listEmbed.setFooter({ text: `Page ${currentPage}/${Math.ceil(ObaBogaInstancesList.length / pageSize)}` })
                            listEmbed.setDescription(Paginate(ObaBogaInstancesList, pageSize, currentPage).join("\n"))
                            await interaction.editReply({ embeds: [listEmbed], components: [buttonsRow], ephemeral: true });
                        });

                        break;
                    }
                }
            } else if (interaction.options.getSubcommand() === 'select') {
                await interaction.deferReply({ ephemeral: true });
                const userObaBogaID = interaction.options.getInteger('id');
                // Search the DB to verify if the instance ID exist
                const selectedObaBogaInstanceSQL = await ObaBogaInstanceSQL.findByPk(userObaBogaID);
                if (selectedObaBogaInstanceSQL) {

                    /** Create the new instance
                     * @type {ModelInstance}
                    */
                    const ObaConnection = interaction.client.ObaConnection = await LoadObaBogaInstanceFromSQL(userObaBogaID)

                    try {
                        // Save the ObaBogaInstance ID as the new default instance
                        const BotGeneralSettings = await BotGeneralSettingsSQL.findByPk(1)
                        BotGeneralSettings.update({ currentObaBogaInstanceID: userObaBogaID })

                        await interaction.editReply({ content: `The ObaBogaInstance with ID \`${userObaBogaID}\` has been loaded!`, ephemeral: true });
                    } catch (error) {
                        console.log(error)
                        await interaction.editReply({ content: `Failed to update **currentObaBogaInstanceID** from BotGeneralSettings SQL.`, ephemeral: true });
                    }

                } else {
                    await interaction.editReply({ content: `Failed to find the ObaBogaInstance with ID \`${userObaBogaID}\`!`, ephemeral: true });
                }
            } else if (interaction.options.getSubcommand() === 'clear') {
                await interaction.deferReply({ ephemeral: true });
                const BotGeneralSettings = await BotGeneralSettingsSQL.findByPk(1)
                const ObaInstanceID = BotGeneralSettings.currentObaBogaInstanceID

                /**
                 * @type {ModelInstance}
                */
                const ObaConnection = interaction.client.ObaConnection

                if (ObaInstanceID) {
                    if (ObaConnection) {
                        await ObaConnection.ClearChatHistory();
                        // Delete all message that are part of the current ObaInstanceID from the SQL DB
                        const messageDeletedNum = await ObaBogaInstanceChatHistorySQL.destroy({
                            where: {
                                ObaBogaInstanceID: ObaInstanceID
                            }
                        })
                        await interaction.editReply({ content: `Removed ${messageDeletedNum} messages from the ObaBogaInstance ID **${ObaInstanceID}**.`, ephemeral: true });
                    } else {
                        await interaction.editReply({ content: `There is no ObaBogaInstance currently loaded.`, ephemeral: true });
                    }
                } else {
                    await interaction.editReply({ content: `Failed to find the current ObaBogaInstance ID inside BotGeneralSettingsSQL.`, ephemeral: true });
                }
            }
        }
    },
};