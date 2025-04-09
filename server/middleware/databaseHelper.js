/* === Handles initialization and interaction with the SQLite database. Attaches database utility functions to requests for use in middleware. === */
const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const fs = require("fs");
const fsPromises = require("fs/promises");
const bcrypt = require('bcrypt'); // Library for hashing passwords securely

// the db variable, no value yet because for now the db first needs to be deleted, which is asynchronous
var dbpath = "private/my.db";
var db;
var insertDataIntoDb = require('../private/populateDatabase');

// Function to fill the database with necessary tables and sample data
const filldb = () => {
  // Initialize the database connection
  db = new sqlite3.Database(dbpath);

  return fsPromises.readFile("private/dbdef.txt")
    .then((sql) => execute(sql.toString()))
    .then(insertDataIntoDb)
    .catch((err) => console.error("Error filling the database:", err));
};

// deletes the db if it exists, and then calls fillDb
if (fs.existsSync(dbpath)) {
  db = new sqlite3.Database(dbpath);
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

// for executing a single sql query with params and returns a single result
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

// for executing a single sql query with params and returns the results
const allSql = (sql, params = [], localDb) => new Promise((res, rej) => {
  if (!localDb)
    localDb = db;
  db.all(sql, params, function (err, result) {
    if (err)
      rej(err);
    else
      res(result, {lastID: this.lastID, changes: this.changes});
  });
});

// the module function that adds the usefull db functions and the db itself to the req object, for easy access by other middleware
function dbHelper(req, res, next) {
  req.db = {
    baseDb: db,
    runSql: runSql,
    getSql: getSql,
    allSql: allSql
  };
  next();
}

module.exports = dbHelper;