const express = require('express');
const sessionMiddleware = require('../middleware/session');
const dayjs = require('dayjs'); 

const router = express.Router();

var messagesRouter = require('./userMessages');
const profileRouter = require('./userProfile');

// router.use(function (req, res, next) {
//   // for testing
//   // TODO: remove later
//   if (typeof req.query.name == 'string' && req.query.name.startsWith('sem')) {
//     testCase(req, res, next);
//     return;
//   }
//   next();
// });

router.use(function (req, res, next) {
  if (!req.loggedIn) {
    switch (req.method) {
      case 'GET':
        return res.redirect('/auth/login');
      case 'POST':
        return res.status(401);
      case 'PUT':
        return res.status(401);
      default:
        return res.status(401);
    }
  }

  next();
});

/* GET Messages Page */
router.use('/messages', messagesRouter);

/* GET Courses Page */
const userCoursesRouter = require('./userCourses');
router.use('/courses', userCoursesRouter);

/* GET Profile Page */
router.use('/profile', profileRouter);

module.exports = router;

// for testing only, do not use this.
var testMade = false;
function testCase(req, res, next) {
  req.user = {
    loggedIn: true,
    Id: parseInt(req.query.name[3])
  }
  // req.session = {
  //   loggedIn: true,
  //   user: { studentId: parseInt(req.query.name[3]) }
  // }
  const addUser = (fname, lname, email, password) => {
    return req.db.runSql("INSERT INTO Student(firstName, lastName, email, password) VALUES(?, ?, ?, ?);", [fname, lname, email, password]);
  };

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
  var nameList = [
    'Time','Past','Future','Dev',
    'Fly','Flying','Soar','Soaring','Power','Falling',
    'Fall','Jump','Cliff','Mountain','Rend','Red','Blue',
    'Green','Yellow','Gold','Demon','Demonic','Panda','Cat',
    'Kitty','Kitten','Zero','Memory','Trooper','XX','Bandit',
    'Fear','Light','Glow','Tread','Deep','Deeper','Deepest',
    'Mine','Your','Worst','Enemy','Hostile','Force','Video',
    'Game','Donkey','Mule','Colt','Cult','Cultist','Magnum',
    'Gun','Assault','Recon','Trap','Trapper','Redeem','Code',
    'Script','Writer','Near','Close','Open','Cube','Circle',
    'Geo','Genome','Germ','Spaz','Shot','Echo','Beta','Alpha',
    'Gamma','Omega','Seal','Squid','Money','Cash','Lord','King',
    'Duke','Rest','Fire','Flame','Morrow','Break','Breaker','Numb',
    'Ice','Cold','Rotten','Sick','Sickly','Janitor','Camel','Rooster',
    'Sand','Desert','Dessert','Hurdle','Racer','Eraser','Erase','Big',
    'Small','Short','Tall','Sith','Bounty','Hunter','Cracked','Broken',
    'Sad','Happy','Joy','Joyful','Crimson','Destiny','Deceit','Lies',
    'Lie','Honest','Destined','Bloxxer','Hawk','Eagle','Hawker','Walker',
    'Zombie','Sarge','Capt','Captain','Punch','One','Two','Uno','Slice',
    'Slash','Melt','Melted','Melting','Fell','Wolf','Hound',
    'Legacy','Sharp','Dead','Mew','Chuckle','Bubba','Bubble','Sandwich','Smasher','Extreme','Multi','Universe','Ultimate','Death','Ready','Monkey','Elevator','Wrench','Grease','Head','Theme','Grand','Cool','Kid','Boy','Girl','Vortex','Paradox'
  ];

  function generate() {
    return nameList[Math.floor( Math.random() * nameList.length )];
  };

  const act1 = () => {
    return req.db.getSql(`SELECT * FROM Student S WHERE S.studentId = ?;`, [req.user.Id]
    ).then((row) => {
      if (!row) {
        var fn = generate();
        var ln = generate();
        var pr = req.db.runSql("INSERT INTO Student(studentId, firstName, lastName, email, password) VALUES(?, ?, ?, ?, ?);", [req.user.Id, fn, ln, fn + "@" + ln + ".com", "password"]
        ).then(req.db.runSql("INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [1, req.user.Id])
        ).then(req.db.runSql("INSERT INTO ChatParticipent(chatId, studentId) VALUES(?, ?);", [1, req.user.Id]));
        return pr;
      }
    }
    ).then(() => next());
  };
  
  if (!testMade){
    testMade = true;
    
    // Initialize database and create necessary tables
    fs.readFile("private/dbdef.txt"
    ).then(() => req.db.runSql("INSERT INTO Friendship(date) VALUES(?);", [dayjs().format('YYYY/MM/DD')])
    ).then(() => req.db.runSql("INSERT INTO Chat(creationDate, name) VALUES(strftime('%Y-%m-%d','now'), ?);", ["global chat"])
    ).then(() => act1()
    ).catch(err => console.log(err));
  }
  else
    act1();
}