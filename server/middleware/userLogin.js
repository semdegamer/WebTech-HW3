const bcrypt = require('bcrypt'); // Library for hashing passwords securely
const crypto = require('crypto'); // Library for generating secure random session tokens
const dayjs = require('dayjs'); // Library for handling date and time operations

const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const dbPath = __dirname + "/sqlite.db";
const db = new sqlite3.Database(":memory:"); // for now in memory for easy testing

const execute = (db, sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

const fs = require("fs/promises");

const runSql = (db, sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, (err, result) => {
    if (err)
      rej(err);
    else
      res();
  });
});

const getSql = (db, sql, params = []) => new Promise((res, rej) => {
  db.get(sql, params, (err, result) => {
    if (err)
      rej(err);
    else
      res(result);
  });
});

// Initialize database and create necessary tables
fs.readFile("private/dbdef.txt"
).then((sql) => execute(db, sql.toString())
).then(() => bcrypt.hash("a", 10)
).then((passwordHash) => runSql(db, "INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", ["sem", "mathan", "a@a", passwordHash])
).then(() => console.log("db made")
).catch((err) => console.error(err));

function userLogin(req, res) {
  var data = req.body; // Get user login details from request

  // Check if the email exists in the database
  getSql(db, "SELECT * FROM Student WHERE email = ?;", [data.email]
  ).then((row) => {
    if (!row)
      wrongEmail();
    else
      bcrypt.compare(data.password, row.password).then((result) => {
        console.log(JSON.stringify(row));
        if (result)
          success(row);
        else
          wrongPassword();
      }).catch(errorInternal);
  }).catch(errorInternal);

  function errorInternal(err) {
    console.log(err);
    res.send(JSON.stringify({
      success: false,
      message: "an internal error occured, try again later."
    }));
  }

  function wrongEmail() {
    res.send(JSON.stringify({
      success: false,
      message: "email address not found, register first."
    }));
  }

  function wrongPassword() {
    res.send(JSON.stringify({
      success: false,
      message: "incorrect password, please try again."
    }));
  }

  // Student is being logged in
  function success(student) {
    // Generate a secure session token
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Set session expiration (1 hour from now)
    const expiresAt = dayjs().add(1, 'hour').unix();
    const createdAt = dayjs().unix(); // Current time (session creation time)

    // Store the session in the database
    runSql(db, "INSERT INTO Session(sessionId, studentId, expiresAt, createdAt) VALUES (?, ?, ?, ?);", 
      [sessionId, student.studentId, expiresAt, createdAt]
    ).then(() => {
      // Send session token to the client
      res.cookie("sessionId", sessionId, { 
        httpOnly: true, 
        secure: true, 
        maxAge: 3600000 }); // Cookie expires in 1 hour
      res.send(JSON.stringify({
        success: true
      }));
    }).catch(errorInternal);
  }
}

module.exports = userLogin;