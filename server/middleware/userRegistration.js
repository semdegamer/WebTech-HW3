const bcrypt = require('bcrypt');
const fs = require("fs/promises");
const sqlite3 = require("sqlite3").verbose();

const dbPath = __dirname + "/sqlite.db";
const db = new sqlite3.Database(":memory:"); // In-memory for testing purposes

const execute = (db, sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

// Initialize the database and create the necessary tables
fs.readFile("private/dbdef.txt")
  .then((sql) => execute(db, sql.toString())) // Execute the SQL schema to set up tables
  .then(() => console.log("Database initialized"))
  .catch((err) => console.error("Error initializing database:", err));

const runSql = (db, sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, (err) => {
    if (err) rej(err);
    else res();
  });
});

const getSql = (db, sql, params = []) => new Promise((res, rej) => {
  db.get(sql, params, (err, result) => {
    if (err) rej(err);
    else res(result);
  });
});

function userRegistration(req, res) {
  const data = req.body;

  // Validate input fields
  if (!data.firstName || !data.lastName || !data.email || !data.password) {
    return res.send(JSON.stringify({ success: false, message: "All fields are required!" }));
  }

  // Check if the email already exists
  getSql(db, "SELECT * FROM Student WHERE email = ?;", [data.email])
    .then((row) => {
      if (row) {
        return res.send(JSON.stringify({ success: false, message: "Email is already registered!" }));
      }

      // Hash the password
      return bcrypt.hash(data.password, 10);
    })
    .then((hashedPassword) => {
      if (!hashedPassword) return; // Prevent further execution if email exists
      
      return runSql(db, "INSERT INTO Student (firstName, lastName, email, password) VALUES (?, ?, ?, ?);", 
        [data.firstName, data.lastName, data.email, hashedPassword]);
    })
    .then(() => {
      res.send(JSON.stringify({ success: true, message: "Registration successful!" }));
    })
    .catch((err) => {
      console.error(err);
      res.send(JSON.stringify({ success: false, message: "An internal error occurred. Please try again later." }));
    });
}

module.exports = userRegistration;
