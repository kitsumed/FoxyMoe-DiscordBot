const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');

module.exports = {
    name: VoiceConnectionStatus.Disconnected,
    async execute(oldState, newState) {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
        }
    },
};