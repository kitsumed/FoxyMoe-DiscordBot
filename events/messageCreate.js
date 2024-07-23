const { Events, Message, MessageType, MessageFlags } = require('discord.js');
const { BotGeneralSettingsSQL, ObaBogaInstanceChatHistorySQL } = require('../modules/Database.js')

const aiChannelID = process.env.ChatAiChannelID
/**
 * Make the LLM chat completions request and reply in the discord channel with the response of the LLM
 * @param {Message} message 
 */
async function SendLLMResponse(message) {
    const messageContent = message.cleanContent
    const userId = message.author.id
    const username = message.author.username
    const channelName = message.channel.name
    const BotGeneralSettings = await BotGeneralSettingsSQL.findByPk(1)
    /**@type {import('../modules/ObaBogaAPI.js').ModelInstance} */
    const ObaConnection = message.client.ObaConnection

    // Catch errors, prevent issue like when users remove their messages just before the bot reply
    try {
        if (ObaConnection && BotGeneralSettings.currentObaBogaInstanceID) {
            await message.channel.sendTyping();
            /**@type {import('../modules/ObaBogaAPI.js').ChatCompletion} */
            const chatCompletion = await ObaConnection.PostChatCompletions(`UID:${userId} CONTENT:${messageContent}`, `Has chosen the nickname of '${username}'. Currently talking in a channel named '${channelName}'.`);
            if (chatCompletion) {
                // Save the user & assistant message in the SQL DB
                await ObaBogaInstanceChatHistorySQL.bulkCreate([{
                    role: "user",
                    content: chatCompletion.prompt.content,
                    embedding: JSON.stringify(chatCompletion.prompt.embedding),
                    ObaBogaInstanceID: BotGeneralSettings.currentObaBogaInstanceID
                }, {
                    role: "assistant",
                    content: chatCompletion.response.content,
                    embedding: JSON.stringify(chatCompletion.response.embedding),
                    ObaBogaInstanceID: BotGeneralSettings.currentObaBogaInstanceID
                }])
                await message.reply(chatCompletion.response.content)
            }
            else {
                await message.reply("The bot failed to get a response from the LLM.")
            }
        } else {
            await message.reply("There is no ObaBogaInstance currently selectionned.")
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Queue for the SendLLMResponse function.
 * Upon initialisation, call itself to set its value to a "blank" function
 * @param {Message} message
 */
const SendLLMResponseTask = (
    () => {
        // Set default promise to resolved, this line is only run once, when SendLLMResponseTask is initialising
        let pending = Promise.resolve();

        // Handle the "Task" of waiting for the previous run task to end and then call SendLLMResponse
        const run = async (message) => {
            try {
                // Wait until the default promise OR the promise of the run function inside "pending" get resolved
                await pending;
            } catch (err) {
                console.error(err)
            }
            // This get executed when the task is not waiting for the previous one anymore
            // Generate & send the LLM response
            return await SendLLMResponse(message);
        }

        /* Return a "blank" fonction with the "message" param. SendLLMResponseTask will store that function and execute
         * it when called.
        */
        return (message) => (
            // Update pending promise so that next run "Task" can await
            pending = run(message)
        )
    }
)();

module.exports = {
    name: Events.MessageCreate,
    /**
     * Listen inside the AI talk channel defined in the .env config
     * @param {Message} message 
     */
    async execute(message) {
        const userId = message.author.id
        // Verify that the message wasn't send by the bot itself & that the message was send in the right channel
        if (userId != message.client.user.id && message.channel.id == aiChannelID) {
            // Verify that the message type if valid
            if (message.type == MessageType.Default || message.type == MessageType.Reply) {
                // If the message is not a "@silent"
                if (message.flags.bitfield != MessageFlags.SuppressNotifications) {
                    SendLLMResponseTask(message)
                }
            }
        }
    },
};