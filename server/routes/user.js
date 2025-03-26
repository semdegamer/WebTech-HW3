var express = require('express');
var router = express.Router();

var nav = ["messages", "courses"];

router.use(function(req, res, next) {
  var loggedIn = false;
  // check if user is logged in
  if (loggedIn)
    next();
  else
    res.redirect('/auth/login');
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
