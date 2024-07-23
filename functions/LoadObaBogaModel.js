const { ModelInstance } = require('../modules/ObaBogaAPI.js');

/**
 * Verify the current model and load the new one if they don't match.
 * @param {ModelInstance} obaConnection The ModelInstance of a ObaBogaInstance
 * @param {Number} newModelName The new model to load
 * @returns {Promise<Boolean>} True if the model was loaded, false if not
 */
const LoadObaBogaModel = async (obaConnection, newModelName) => {
    const currentModelName = await obaConnection.GetCurrentModelName();
    if (currentModelName !== newModelName) {
        // Return true if true, false if false or null
        return await obaConnection.LoadModel(newModelName) ? true : false
    }
    return false
}

module.exports = { LoadObaBogaModel }