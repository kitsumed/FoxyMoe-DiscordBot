const { ObaBogaInstanceSQL, ObaBogaInstanceChatHistorySQL } = require('../modules/Database.js');
const { CreateObaBogaInstance, ModelInstance } = require('../modules/ObaBogaAPI.js');

/**
 * Create a ObaBogaInstance by reusing the saved DB settings and load the chat history into the instance.
 * @param {Number} instanceID The ID of the ObaBogaInstance inside the SQL DB
 * @returns {Promise<ModelInstance>} ObaBogaAPI ModelInstance
 */
const LoadObaBogaInstanceFromSQL = async (instanceID) => {
    const selectedObaBogaInstanceSQL = await ObaBogaInstanceSQL.findByPk(instanceID);
    const ObaConnection = await CreateObaBogaInstance(
        process.env.OobaboogaApiEndpoint,
        440, // 440 tokens is around the lenght limit for messages on discord
        selectedObaBogaInstanceSQL.seed,
        selectedObaBogaInstanceSQL.chatAssistantName,
        process.env.OobaboogaChatMode,
        process.env.OobaboogaInstructionTemplateName,
        selectedObaBogaInstanceSQL.assistantContext,
        selectedObaBogaInstanceSQL.chatUserName,
        selectedObaBogaInstanceSQL.chatSystemMessage,
        true,
        (process.env.OobaboogaUseEmbeddings === "true")
    );

    // Search for messages saved in the chat history that are related to the instanceID
    const messagesSQL = await ObaBogaInstanceChatHistorySQL.findAll({
        where: {
            ObaBogaInstanceID: instanceID
        }
    })
    // If messages where found, convert them to the MessageHistory format used by a ObaBogaInstance
    if (messagesSQL.length >= 1) {
        let messages = messagesSQL.flatMap(message => [{
            role: message.role,
            content: message.content,
            // Convert back the array saved as json to a array
            embedding: JSON.parse(message.embedding) || undefined
        }]);
        const isSuccess = await ObaConnection.SetChatHistory(messages);
        if (!isSuccess) {
            console.warn(`Failed to load the messages for the instance ID '${instanceID}' into the ObaBogaInstance.`)
        }
    }
    return ObaConnection
}

module.exports = { LoadObaBogaInstanceFromSQL }