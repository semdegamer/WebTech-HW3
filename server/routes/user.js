const express = require('express');
const sessionMiddleware = require('../middleware/session');
const userChats = require('../middleware/userChats');
const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const dayjs = require('dayjs'); // Library for handling date and time operations

const router = express.Router();

router.use(function (req, res, next) {
  // for testing
  // TODO: remove later
  if (typeof req.query.name == 'string' && req.query.name.startsWith('sem')) {
    testCase(req, res, next);

    return;
  }

  sessionMiddleware(req, res, next);
});

/* GET Messages Page */
router.get('/messages', userChats.getChatsPage);

router.post('/messages', userChats.createChat);

router.param('chat', userChats.paramMessageChat);

router.get('/messages/:chat', userChats.getMessagePage);

router.post('/messages/:chat', userChats.postMessage);

router.get('/messages/:chat/events', userChats.messageStream);

/* GET Courses Page */
router.get('/courses', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/courses', { user: req.session.user });
});

/* GET Profile Page */
router.get('/profile', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/profile', { user: req.session.user });
});

module.exports = router;


// for testing only, do not use this.
var testDb;
function testCase(req, res, next) {
  req.user = {
    loggedIn: true,
    Id: parseInt(req.query.name[3])
  }
  const addUser = (fname, lname, email, password) => {
    return req.db.runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", [fname, lname, email, password]);
  };

  req.session = {
    loggedIn: true,
    userId: parseInt(req.query.name[3])
  }

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

  const act1 = () => {
    next();
  };
  
  if (!testDb){
    testDb = new sqlite3.Database(":memory:"); // for now in memory for easy testing
    
    // Initialize database and create necessary tables
    fs.readFile("private/dbdef.txt"
    ).then(() => addUser("p1", "1", "e1", "1")
    ).then(() => addUser("p2", "2", "e2", "2")
    ).then(() => req.db.runSql("INSERT INTO Friendship(date) VALUES(?);", [dayjs().format('YYYY/MM/DD')])
    ).then(() => req.db.runSql("INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [1, 1])
    ).then(() => req.db.runSql("INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [1, 2])
    ).then(() => req.db.runSql("INSERT INTO Chat(creationDate, name) VALUES(strftime('%Y-%m-%d','now'), ?);", ["the chat"])
    ).then(() => req.db.runSql("INSERT INTO ChatParticipent(chatId, studentId) VALUES(?, ?);", [1, 1])
    ).then(() => req.db.runSql("INSERT INTO ChatParticipent(chatId, studentId) VALUES(?, ?);", [1, 2])
    ).then(() => act1());
  }
  else
    act1();
}