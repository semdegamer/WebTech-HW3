var express = require('express');
var router = express.Router();
const sqlite3 = require("sqlite3").verbose(); // verbose for better error logging
const db = new sqlite3.Database(":memory:"); // for now in memory for easy testing
const dayjs = require('dayjs'); // Library for handling date and time operations

var nav = ["messages", "courses"];

router.use(function(req, res, next) {
  const sessionId = req.cookies.sessionId; // Get sessionId from cookie
  
  if (!sessionId) {
      return res.redirect('/auth/login');
  }

  // Query database to get session and check if expired
  getSql(db, "SELECT userId, expiresAt FROM Session WHERE id = ?;", [sessionId])
  .then((session) => {
      if (!session || session.expiresAt < dayjs().unix()) {
          res.clearCookie('sessionId'); // Delete expired cookie
          return res.redirect('/auth/login');
      }

      req.session = { userId: session.userId }; // Attach userId to request
      next();
  })

  // If an error occurs, delete cookie and redirect to login page
  .catch((err) => {
    console.error("Error checking session:", err);
    res.clearCookie('sessionId');
    return res.redirect('/auth/login');
  });
});

/* GET Messages Page */
router.get('/messages', function(req, res) {
  res.render('user/messages', { nav: nav});
});

/* GET Courses Page */
router.get('/courses', function(req, res) {
  res.render('user/courses', { nav: nav});
});

/* GET Profile Page */
router.get('/profile', function(req, res) {
  res.render('user/profile', { nav: nav});
});

module.exports = router;
