const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const fs = require("fs");
const fsPromises = require("fs/promises");
const bcrypt = require('bcrypt'); // Library for hashing passwords securely

var db;

const filldb = () => {
  // Initialize database and create necessary tables synchronously
  db = new sqlite3.Database(dbpath);

  return fsPromises.readFile("private/dbdef.txt")
  .then((sql) => execute(sql.toString()))
  .then(() => bcrypt.hash("a", 10))
  .then((passwordHash) => runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", ["sem", "mathan", "a@a", passwordHash]))
  .then(() => console.log("db made"));
}

const dbpath = "private/my.db";
if (fs.existsSync(dbpath)) {
  fsPromises.unlink(dbpath)
  .then(() => filldb())
  .catch((err) => console.log(err));
} else {
  filldb()
  .catch((err) => console.log(err));
}

const execute = async (sql, localDb) => {
  if (!localDb)
    localDb = db;
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

const runSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.run(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res({lastID: this.lastID, changes: this.changes});
  });
});

const getSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.get(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res(result, {lastID: this.lastID, changes: this.changes});
  });
});

function dbHelper(req, res, next) {
  req.db = {
    get: db,
    runSql: runSql,
    getSql: getSql
  };
}

module.exports = dbHelper;