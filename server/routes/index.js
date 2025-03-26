var express = require('express');
var router = express.Router();

var nav = ["messages", "courses"];

/* GET Messages Page if no page is specified */
router.get('/', function(req, res) {
  res.redirect('/messages');
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

/* GET Login Page */
router.get('/login', function(req, res) {
  res.render('auth/login', { title: 'Login' });
});

/* GET Register Page */
router.get('/register', function(req, res) {
  res.render('auth/register', { title: 'Register'});
});

module.exports = router;
