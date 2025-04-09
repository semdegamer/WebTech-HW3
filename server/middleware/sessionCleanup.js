/* === Periodically removes expired sessions from the database to keep the Session table clean and efficient. === */
const dayjs = require('dayjs');

module.exports = function cleanupSessions(db) {
    const currentTime = dayjs().unix();

    db.runSql("DELETE FROM Session WHERE expiresAt < ?;", [currentTime])
        .then(() => console.log("Expired sessions cleaned up successfully"))
        .catch(err => console.error("Error cleaning up expired sessions:", err));
};

// This function will be called every 10 minutes to clean up expired sessions
module.exports.startCleanup = function (db) {
    setInterval(() => cleanupSessions(db), 600000);
};
