/* === User Pages Route Handler === */
const express = require('express');
const sessionMiddleware = require('../middleware/session');
const dayjs = require('dayjs'); 

const router = express.Router();

const messagesRouter = require('./userMessages');
const coursesRouter = require('./userCourses');
const friendsRouter = require('./userFriends');
const profileRouter = require('./userProfile');

// TODO: for testing only
let dummyFriends = true;
router.use(function (req, res, next) {
  if (!dummyFriends) {
    dummyFriends = true;
    const arrayRange = (start, stop, step) =>
      Array.from(
        { length: (stop - start) / step + 1 },
        (value, index) => start + index * step
      );

    Promise.all(arrayRange(5, 50, 1).map(num => addStudent(req.db, num)))
      .then(() => next())
      .catch(next);
  } else {
    next();
  }
});

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
router.use('/courses', coursesRouter);

/* GET Friends Page */
router.use('/friends', friendsRouter);

/* GET Profile Page */
router.use('/profile', profileRouter);

module.exports = router;

// for testing only, do not use this.
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
const bcrypt = require('bcrypt');
function addStudent(db, id) {
  var fn = generate();
  var ln = generate();
  return bcrypt.hash("password", 10)
    .then(hash => db.runSql("INSERT INTO Student(studentId, firstName, lastName, email, password) VALUES(?, ?, ?, ?, ?);", [id, fn, ln, fn + "@" + ln + ".com", hash]))
    .then(db.runSql("INSERT INTO Friendship(date) VALUES(?);", [dayjs().format('YYYY/MM/DD')]))
    .then(result => db.runSql("INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [result.lastID, 1])
      .then(db.runSql("INSERT INTO Friend(friendshipId, studentId) VALUES(?, ?);", [result.lastID, id])))
}