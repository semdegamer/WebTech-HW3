// Code to clean up expired sessions from the database
const sqlite3 = require("sqlite3").verbose(); 
const dayjs = require('dayjs'); 

const db = new sqlite3.Database(":memory:"); // for now in memory for easy testing

// Function to clean up expired sessions
function cleanupSessions() {
// Get the current time in Unix timestamp 
  const currentTime = dayjs().unix();
  runSql(db, "DELETE FROM Session WHERE expiresAt < ?;", [currentTime])
  .then(() => console.log("Expired sessions cleaned up successfully"))
  .catch(err => console.error("Error cleaning up expired sessions:", err));
}

// Run cleanup every 10 minutes 
setInterval(cleanupSessions, 600000);

// Export the cleanup function so it can be used elsewhere in the application if needed
module.exports = cleanupSessions;
