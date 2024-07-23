/*
 * This module allow communication with the oobabooga GPT-like API.
 * Author : kitsumed
 */
const { create: CreateVectorDB, insert: InsertIntoVectorDB, insertMultiple: InsertMultipleVectorDB, search: SearchVectorDB } = require('@orama/orama')
const axios = require('axios').default

/**
 * Create a new instance
 * @param {String} apiEndpoint URL of the oobabooga API
 * @param {Number} generationSeed (OPTIONAL) Define the seed used for generations. -1 for random. A fix seed allow generations reproducibility.
 * @param {Number} maxTokens (OPTIONAL) Define the maximum lenght of the reponse
 * @param {String} chatAssistantName (OPTIONAL) Define the name of the assistant when doing ChatCompletions. Often necessary if using system prompt.
 * @param {String} chatMode (OPTIONAL) Define the mode to use when doing ChatCompletions
 * @param {String} chatInstructionTemplateName (OPTIONAL) Define the template to use when doing ChatCompletions
 * @param {String} assistantContext (OPTIONAL) Define the context of the assistant
 * @param {String} chatUserName (OPTIONAL) Define the name of the user when doing ChatCompletions.
 * @param {String} chatSystemMessage (OPTIONAL) Define the first SYSTEM prompt.
 * @param {Boolean} multiUserMode (OPTIONAL) When true, the behaviors of the chatcompletions function change to support multi-user conversasions. 
 * @param {Boolean} useEmbeddings (OPTIONAL) When true, the behaviors of VectorDB chathistory change to use embeddings. 
 * 
 * @typedef {Object} ModelInstance
 * @property {import('axios').AxiosInstance} axios Axios Instance
 * @property {JSON} jsonConfig Config for the request
 * @property {JSON[]} chatHistory History of chat completions
 * @property {import('@orama/orama').Orama} chatHistoryVectorDB The orama vector DB of the chat history
 * @property {GetChatAssistantName} GetChatAssistantName Get the name of the chat assistant for the current instance
 * @property {GetChatUserName} GetChatUserName Get the name of the user for the current instance
 * @property {GetEmbeddings} GetEmbeddings Get the embedding for a input
 * @property {GetCurrentModelName} GetCurrentModelName Get the name of the model currently loaded into the oobabooga webui
 * @property {PostCompletions} PostCompletions Generate the continuation of a prompt
 * @property {PostChatCompletions} PostChatCompletions Generate a chat like generation from a prompt
 * @property {SetChatHistory} SetChatHistory Set the current chat history and load it into the VectorDB
 * @property {ClearChatHistory} ClearChatHistory Clear the current chat history to default values
 * @property {LoadModel} LoadModel Load a model by it's name
 * @property {Readonly<Boolean>} multiUserMode Verify if the multi user mode is enabled or not.
 * @property {Readonly<Boolean>} useEmbeddings Verify if the long term memory search use embeddings or not.
 * 
 * @returns {Promise<ModelInstance>} The model/connection instance
 */
exports.CreateObaBogaInstance = async function (apiEndpoint, maxTokens = 440, generationSeed = -1, chatAssistantName = "AI", chatMode = "chat-instruct", chatInstructionTemplateName = "ChatML", assistantContext = " ", chatUserName = "user", chatSystemMessage = undefined, multiUserMode = false, useEmbeddings = false) {
    var newChatHistory = [];
    if (chatSystemMessage) {
        if (multiUserMode) {
            chatSystemMessage = chatSystemMessage.concat(`\nInteraction Notice: You are talking to multiples users. Each '${chatUserName}:' character will always include their unique user id 'UID:' and the content of their message 'CONTENT:' but ${chatAssistantName} does not include these informations.`)
        }
        newChatHistory.push({
            role: "system",
            content: chatSystemMessage
        })
    }
    return {
        axios: axios.create({
            baseURL: apiEndpoint,
            timeout: 120000, // 2 minutes
            responseType: 'json',
            responseEncoding: 'utf8',
            headers: {
                "Content-Type": 'application/json'
            }
        }),
        jsonConfig: {
            // Used by completions & chat
            max_tokens: maxTokens,
            temperature: 0.74,
            repetition_penalty: 1.02,
            repetition_penalty_range: 0, // 0 = verify all tokens in the prompt
            frequency_penalty: 0.04,
            dynamic_temperature: true,
            dynatemp_low: 0.5,
            dynatemp_high: 1.5,
            min_p: 0.1,
            seed: generationSeed,
            context: assistantContext,
            // Used by chat
            mode: chatMode,
            instruction_template: chatInstructionTemplateName,
            name2: chatAssistantName,
            name1: chatUserName,
        },
        chatHistory: newChatHistory,
        chatHistoryVectorDB: await CreateVectorDB({
            schema: {
                role: 'string',
                content: 'string',
                embedding: 'vector[768]' // sentence-transformers/all-mpnet-base-v2 has a 768 dimensional vector
            },
            sort: {
                enabled: false,
            }
        }),
        multiUserMode: Object.freeze(multiUserMode),
        useEmbeddings: Object.freeze(useEmbeddings),
        GetChatAssistantName: GetChatAssistantName,
        GetChatUserName: GetChatUserName,
        GetEmbeddings: GetEmbeddings,
        GetCurrentModelName: GetCurrentModelName,
        PostCompletions: PostCompletions,
        PostChatCompletions: PostChatCompletions,
        SetChatHistory: SetChatHistory,
        ClearChatHistory: ClearChatHistory,
        LoadModel: LoadModel,
    }
}

/**
 * Get the name of the chat assistant for the current instance
 * @returns {string}
 * @this ModelInstance
 */
const GetChatAssistantName = function () {
    return this.jsonConfig.name2;
}

/**
 * Get the name of the user for the current instance
 * @returns {string}
 * @this ModelInstance
 */
const GetChatUserName = function () {
    return this.jsonConfig.name1;
}

/**
 * Overwrite chatHistory & chatHistoryVectorDB with new values. Keep system messages
 * @param {JSON[]} newChatHistory The new chat history
 * @returns {Promise<Boolean>} True if it loaded, false if it failed
 * @this ModelInstance
 */
const SetChatHistory = async function (newChatHistory) {
    try {
        // Remove all SYSTEM role from the new chat history
        newChatHistory = newChatHistory.filter(value => value.role !== "system")
        // Keep only the system message set when creating the instance
        this.chatHistory = this.chatHistory.filter(value => value.role === "system")
        // Push the new chat history
        this.chatHistory = this.chatHistory.concat(newChatHistory)
        // Overwrite and load a new VectorDB
        this.chatHistoryVectorDB = await CreateVectorDB({
            schema: {
                role: 'string',
                content: 'string',
                embedding: 'vector[768]' // sentence-transformers/all-mpnet-base-v2 has a 768 dimensional vector
            },
            sort: {
                enabled: false,
            }
        })
        await InsertMultipleVectorDB(this.chatHistoryVectorDB, newChatHistory, 600);
        return true;
    } catch (err) {
        console.error(err)
    }
    return false;
}

/**
 * Overwrite chatHistory & chatHistoryVectorDB with default values.
 * @async
 * @this ModelInstance
 */
const ClearChatHistory = async function () {
    // Overwrite the chat history to only keep system messages
    this.chatHistory = this.chatHistory.filter(value => value.role === "system")
    // Overwrite the VectorDB chat history
    this.chatHistoryVectorDB = await CreateVectorDB({
        schema: {
            role: 'string',
            content: 'string',
            embedding: 'vector[768]' // sentence-transformers/all-mpnet-base-v2 has a 768 dimensional vector
        },
        sort: {
            enabled: false,
        }
    })
}

/**
 * Send a completion request to oogabooga
 * @param {string} prompt The prompt to complete
 * @returns {Promise<string>} The completion by the LLM, including the original prompt. Null if a error occured.
 * @this ModelInstance
 */
const PostCompletions = async function (prompt) {
    var requestJsonConfig = {
        prompt: prompt
    }
    // Add the instance json config to the new request config
    requestJsonConfig = Object.assign(requestJsonConfig, this.jsonConfig)
    // Make the request
    return await this.axios.post('/v1/completions', JSON.stringify(requestJsonConfig)).then(function (response) {
        const promptCompletion = response.data.choices[0].text;
        if (promptCompletion) {
            return prompt + promptCompletion
        }
        console.warn(`PostCompletions Error : Failed to find the LLM output in the API response.`);
        return null
    }).catch(function (error) {
        console.error("PostCompletions: Error during API request, returning null. ERROR:", error);
        return null
    })
}

/**
 * Send a chat completion request to oogabooga
 * @param {string} prompt The prompt to send to chat
 * @param {userbio} userbio (OPTIONAL) The context of the user associated with the prompt.
 * 
 * @typedef {Object} ChatCompletion
 * @property {ChatCompletionContent} prompt The user prompt informations
 * @property {ChatCompletionContent} response The LLM response & informations
 * 
 * @typedef {Object} ChatCompletionContent
 * @property {string} role Role in the chat history
 * @property {string} content Message chat history
 * @property {Number[]} embedding embedding of the content
 * 
 * @returns {Promise<ChatCompletion>} The completion information/results, or null if a error occured.
 * @this ModelInstance
 */
const PostChatCompletions = async function (prompt, userbio = "") {
    // This variable is used to perform search with the CONTENT of a prompt
    var promptContent = prompt
    var promptContentEmbedding
    // Verify if the instance is in multi-user mode
    if (this.multiUserMode) {
        // Split the prompt so that [0] is = to UID:value & [1] = CONTENT:value
        const promptParamKeys = prompt.split(' ', 2)
        // Verify that the prompt does have a UID & CONTENT
        if (promptParamKeys[0].split(':')[0] !== "UID" || promptParamKeys[1].split(':')[0] !== "CONTENT") {
            console.error("PostChatCompletions: Current instance has multiUserMode enabled. Please ensure that your prompt is in the following format 'UID:value CONTENT:value'.")
            return null;
        }
        // Set the prompt CONTENT
        promptContent = promptParamKeys[1].split(':')[1]
        // Get the UID
        const userID = promptParamKeys[0].split(':')[1]
        // Overwrite userbio for multiuser mode
        userbio = `${userID} Informations: ${userbio !== "" ? userbio : "None"}`
    }
    // Preserve SYSTEM message first
    var finalChatHistory = this.chatHistory.filter(value => value.role === "system")
    // Last 6 messages, exclude system messages
    const lastMessageChatHistory = this.chatHistory.filter(value => value.role !== "system").slice(-6)

    // Only start to use vectorDB as a "long term" memory if the history has 7+ messages
    // NOTE: The way the long term memory work isn't always efficient. Might be worth reading more on how implement RAG with LLM to improve it.
    if (this.chatHistory.length >= 7) {
        // Search the whole chat history vectorDB for 2 message matching the prompt
        var vectorDBChatHistorySearchResults;
        if (this.useEmbeddings) {
            // Search with embeddings & words (hybrid)
            promptContentEmbedding = await this.GetEmbeddings(promptContent)
            // Verify if the request was a success or if a error occured
            if (promptContentEmbedding !== null) {
                vectorDBChatHistorySearchResults = await SearchVectorDB(this.chatHistoryVectorDB, {
                    mode: "hybrid",
                    term: promptContent,
                    properties: ["content"],
                    vector: {
                        value: promptContentEmbedding,
                        property: "embedding",
                    },
                    similarity: 0.84,
                    includeVectors: false,
                    limit: 2,
                })
            } else {
                console.warn("PostChatCompletions: Failed to get a response from GetEmbeddings for the vector search inside the orama chat history db. Returning null.")
                return null
            }
        } else {
            // Search with words tolerance
            vectorDBChatHistorySearchResults = await SearchVectorDB(this.chatHistoryVectorDB, {
                term: promptContent,
                properties: ["content"], // only search inside content
                limit: 2, // 2 result max
                tolerance: 1, // tolerance to word syntax
                threshold: 1,
            })
        }
        // Add the vectorDB results to the chat history
        vectorDBChatHistorySearchResults.hits.map(hit => {
            // Only add the result if it isn't part of the last 4 message of the short term memory
            if (!lastMessageChatHistory.some(chatMessage => chatMessage.content === hit.document.content && chatMessage.role === hit.document.role)) {
                // Do not add the result if the same message is already in the finalChatHistory, prevent duplicates
                if (!finalChatHistory.some(chatMessage => chatMessage.content === hit.document.content && chatMessage.role === hit.document.role)) {
                    // Only add the role & content to the final history, not the embeddings
                    finalChatHistory.push({
                        role: hit.document.role,
                        content: hit.document.content
                    })
                }
            }
        })
    }
    // Push the last 6 messages to the finalChatHistory
    lastMessageChatHistory.map(chatMessage => finalChatHistory.push(chatMessage))

    // Create request json config
    var requestJsonConfig = {
        messages: finalChatHistory,
        user_bio: userbio
    }
    // Create the user prompt json obj
    const userPrompt = {
        role: "user",
        content: prompt,
        // If useEmbeddings is true, call GetEmbeddings, else set undefined. Not necessary for API request but used later
        embedding: this.useEmbeddings ? (await this.GetEmbeddings(promptContent) || undefined) : undefined
    }
    // Add user prompt inside the json request
    requestJsonConfig.messages.push(userPrompt)
    // Add the instance json config to the new request config
    requestJsonConfig = Object.assign(requestJsonConfig, this.jsonConfig)
    // Make the request
    return await this.axios.post('/v1/chat/completions', JSON.stringify(requestJsonConfig)).then(async (response) => {
        const chatCompletionContent = response.data.choices[0].message.content;
        if (chatCompletionContent) {
            const assistantResponse = {
                role: "assistant",
                content: chatCompletionContent,
                // If useEmbeddings is true, call GetEmbeddings, else set undefined
                embedding: this.useEmbeddings ? (await this.GetEmbeddings(chatCompletionContent) || undefined) : undefined
            }
            // Add the user prompt & generated response to the vectorDB
            await InsertMultipleVectorDB(this.chatHistoryVectorDB, [userPrompt, assistantResponse])
            // Save the user prompt and the AI response to the chat history
            this.chatHistory.push(userPrompt, assistantResponse)
            return {
                prompt: userPrompt,
                response: assistantResponse
            }
        }
        console.warn(`PostChatCompletions Error : Failed to find the LLM output in the API response.`);
        return null
    }).catch(function (error) {
        console.error("PostChatCompletions: Error during API request, returning null. ERROR:", error);
        return null
    })
}

// Issue with v1.10.1 version of oobabooga https://github.com/oobabooga/text-generation-webui/issues/4836
/**
 * @param {string} input The text to process
 * @param {string} encoding_format The type of encoding
 * @returns {Promise<number[]>} A array of numbers, or null if a error occured.
 * @this ModelInstance
 */
const GetEmbeddings = async function (input, encoding_format = "float") {
    const requestJsonConfig = {
        input: input,
        encoding_format: encoding_format
    }

    return await this.axios.post('/v1/embeddings', JSON.stringify(requestJsonConfig)).then(function (response) {
        const embeddings = response.data.data[0].embedding;
        if (embeddings) {
            return embeddings
        }
        console.warn(`GetEmbeddings Error : Failed to find the embedding in the API response.`);
        return null
    }).catch(function (error) {
        console.error("GetEmbeddings: Error during API request, returning null. ERROR:", error);
        return null
    })
}

/**
 * Load a model
 * @param {string} name Name of the model
 * @returns {Promise<boolean>} True if the model was loaded, false if it wasn't found. Null if a error occured.
 */
const LoadModel = async function (name) {
    const requestJsonConfig = {
        model_name: name
    }

    return await this.axios.post('/v1/internal/model/load', JSON.stringify(requestJsonConfig)).then(function (response) {
        // If true, return true, else false
        return (response.status = 200) ? true : false
    }).catch(function (error) {
        console.error("LoadModel: Error during API request, returning null. ERROR:", error);
        return null
    })
}

/**
 * Get the current model name.
 * @returns {Promise<string>} Return the model name or undefined if there isn't any model loaded. Null if a error occured.
 */
const GetCurrentModelName = async function (name) {
    return await this.axios.get('/v1/internal/model/info').then(function (response) {
        const modelName = response.data.model_name
        // If true, modelName, else undefined
        return (modelName !== "None") ? modelName : undefined
    }).catch(function (error) {
        console.error("GetCurrentModelName: Error during API request, returning null. ERROR:", error);
        return null
    })
}