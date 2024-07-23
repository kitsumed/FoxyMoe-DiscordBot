/**
 * @param {import('sequelize').Sequelize} sequelize
 */
module.exports = (sequelize, Sequelize) => {
    /**
     * @type {import('sequelize').DataTypes}
     */
    const DataTypes = Sequelize.DataTypes

    return sequelize.define('BotGeneralSettings', {
        ID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    }, {
        timestamps: false,
    })
}