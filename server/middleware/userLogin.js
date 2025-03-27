const bcrypt = require('bcrypt');

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

fs.readFile("private/dbdef.txt"
).then((sql) => execute(db, sql.toString())
).then(() => bcrypt.hash("a", 10)
).then((passwordHash) => runSql(db, "INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", ["sem", "mathan", "a@a", passwordHash])
).then(() => console.log("db made")
).catch((err) => console.error(err));

function userLogin(req, res) {
  var data = req.body;

  getSql(db, "SELECT * FROM Student WHERE email = ?;", [data.email]
  ).then((row) => {
    if (!row)
      wrongEmail();
    else
      bcrypt.compare(data.password, row.password).then((result) => {
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
  function success(student) {
    // do stuff here to have student be logged in
    res.send(JSON.stringify({
      success: true
    }));
  }
}

module.exports = userLogin;