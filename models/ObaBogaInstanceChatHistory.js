/**
 * @param {import('sequelize').Sequelize} sequelize
 */
module.exports = (sequelize, Sequelize) => {
    /**
     * @type {import('sequelize').DataTypes}
     */
    const DataTypes = Sequelize.DataTypes

    return sequelize.define('ObaBogaInstanceChatHistory', {
        role: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Here, we store vectors (embedding) as JSON since sqlite doest not support arrays.
        embedding: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        timestamps: false,
    })
}