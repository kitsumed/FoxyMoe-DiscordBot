/**
 * @param {import('sequelize').Sequelize} sequelize
 */
module.exports = (sequelize, Sequelize) => {
    /**
     * @type {import('sequelize').DataTypes}
     */
    const DataTypes = Sequelize.DataTypes
    return sequelize.define('ObaBogaInstance', {
        ID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        seed: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        chatAssistantName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        assistantContext: {
            type: DataTypes.STRING(400),
            allowNull: false
        },
        chatUserName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        chatSystemMessage: {
            type: DataTypes.STRING(1200),
            allowNull: false
        }
    }, {
        timestamps: false,
    })
}