var express = require('express');
var router = express.Router();

/* GET home page. 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
*/

/* GET Profile Page */
router.get('/profile', function(req, res) {
  res.render('profile', { title: 'Profile' });
});

/* GET Courses Page */
router.get('/courses', function(req, res) {
  res.render('courses', { title: 'Courses' });
});

/* GET Messages Page */
router.get('/messages', function(req, res) {
  res.render('messages', { title: 'Messages' });
});

/* GET Login Page */
router.get('/login', function(req, res) {
  res.render('login', { title: 'Login' });
});

/* GET Register Page */
router.get('/register', function(req, res) {
  res.render('register', { title: 'Register' });
});

module.exports = router;
