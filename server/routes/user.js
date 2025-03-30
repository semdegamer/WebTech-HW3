const express = require('express');
const sessionMiddleware = require('../middleware/session');

const router = express.Router();
const nav = ["messages", "courses"];

router.use(function (req, res, next) {
  // for testing
  if (req.query.name.startsWith('sem')) {
    testCase(req, res, next);

    return;
  }

  sessionMiddleware(req, res, next);
});

/* GET Messages Page */
router.get('/messages', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/messages', { nav, user: req.session.user });
});

router.param('chat', userChats.paramMessageChat);

router.get('/messages/:chat', userChats.getMessageChat);

router.post('/messages/:chat', userChats.postMessageChat);

router.get('/messages/:chat/events', userChats.eventMessageChat);

/* GET Courses Page */
router.get('/courses', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/courses', { nav, user: req.session.user });
});

/* GET Profile Page */
router.get('/profile', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/profile', { nav, user: req.session.user });
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
    return runSql(testDb, "INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", [fname, lname, email, password]);
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
    req.db = {
      get: testDb,
      runSql: runSql,
      getSql: getSql
    };
    next();
  };
  
  if (!testDb){
    testDb = new sqlite3.Database(":memory:"); // for now in memory for easy testing
    
    // Initialize database and create necessary tables
    fs.readFile("private/dbdef.txt"
    ).then((sql) => execute(testDb, sql.toString())
    ).then(() => addUser("p1", "1", "e1", "1")
    ).then(() => addUser("p2", "2", "e2", "2")
    ).then(() => runSql(testDb, "INSERT INTO Friendship(date) VALUES(?);", [dayjs().format('YYYY/MM/DD')])
    ).then(() => runSql(testDb, "INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [1, 1])
    ).then(() => runSql(testDb, "INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [1, 2])
    ).then(() => runSql(testDb, "INSERT INTO Chat(creationDate) VALUES(?);", [dayjs().format('YYYY/MM/DD')])
    ).then(() => runSql(testDb, "INSERT INTO ChatParticipent(chatId, studentId) VALUES(?, ?);", [1, 1])
    ).then(() => runSql(testDb, "INSERT INTO ChatParticipent(chatId, studentId) VALUES(?, ?);", [1, 2])
    ).then(() => act1());
  }
  else
    act1();
}