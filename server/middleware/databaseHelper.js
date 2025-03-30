const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const fs = require("fs");
const fsPromises = require("fs/promises");
const bcrypt = require('bcrypt'); // Library for hashing passwords securely

// the db variable, no value yet because for now the db first needs to be deleted, which is asynchronous
var dbpath = "private/my.db";
var db;

// fills the db with the tables and some dummy data.
const filldb = () => {
  // Initialize database and create necessary tables synchronously
  db = new sqlite3.Database(dbpath);

  return fsPromises.readFile("private/dbdef.txt")
  .then((sql) => execute(sql.toString()))
  .then(() => bcrypt.hash("a", 10))
  .then((passwordHash) => runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", ["sem", "mathan", "a@a", passwordHash]))
  .then(() => console.log("db made"));
}

// deletes the db if it exists, and then calls fillDb
if (fs.existsSync(dbpath)) {
  fsPromises.unlink(dbpath)
  .then(() => filldb())
  .catch((err) => console.log(err));
} else {
  filldb()
  .catch((err) => console.log(err));
}

// for simply executing a sql queries without params
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

// for executing a single sql query with params and no result
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

// for executing a single sql query with params and returns the result
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

// the module function that adds the usefull db functions and the db itself to the req object, for easy access by other middleware
function dbHelper(req, res, next) {
  req.db = {
    get: db,
    runSql: runSql,
    getSql: getSql
  };
  next();
}

module.exports = dbHelper;